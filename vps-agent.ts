// vps-agent.ts
// Standalone HTTP server para rodar em VPS remotas.
// Expõe endpoints para coleta de stats e execução de deploys.
//
// Uso:
//   VPS_AGENT_TOKEN=seu-token-aqui VPS_AGENT_PORT=9100 npx tsx vps-agent.ts
//
// Ou com Node direto (compilado):
//   VPS_AGENT_TOKEN=seu-token-aqui node vps-agent.js
//
// Endpoints:
//   GET  /health  → { status: "ok" }
//   GET  /stats   → { server: {...}, containers: [...] }
//   POST /deploy  → recebe payload de deploy, executa localmente

import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { execSync, exec } from "child_process";

const PORT = parseInt(process.env.VPS_AGENT_PORT ?? "9100", 10);
const TOKEN = process.env.VPS_AGENT_TOKEN ?? "";

if (!TOKEN) {
  console.error("FATAL: VPS_AGENT_TOKEN is required");
  process.exit(1);
}

// ─── Auth ────────────────────────────────────────────────────────────────

const authenticate = (req: IncomingMessage): boolean => {
  const auth = req.headers.authorization;
  return auth === `Bearer ${TOKEN}`;
};

// ─── Helpers ─────────────────────────────────────────────────────────────

const run = (cmd: string): string => {
  try {
    return execSync(cmd, { timeout: 10000 }).toString().trim();
  } catch {
    return "";
  }
};

const json = (res: ServerResponse, data: unknown, status = 200) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
  });

// ─── Stats ───────────────────────────────────────────────────────────────

const collectStats = () => {
  const memRaw = run("free -b");
  const memLines = memRaw.split("\n");
  const memParts = memLines[1]?.split(/\s+/) ?? [];
  const memTotal = parseInt(memParts[1] ?? "0", 10);
  const memUsed = parseInt(memParts[2] ?? "0", 10);

  const diskRaw = run("df -B1 / | tail -1");
  const diskParts = diskRaw.split(/\s+/);
  const diskTotal = parseInt(diskParts[1] ?? "0", 10);
  const diskUsed = parseInt(diskParts[2] ?? "0", 10);

  const cpuCores = parseInt(run("nproc") || "1", 10);
  const loadAvg = run("cat /proc/loadavg").split(" ");
  const load1 = parseFloat(loadAvg[0] ?? "0");
  const cpuPercent = Math.min((load1 / cpuCores) * 100, 100);

  const uptimeRaw = run("cat /proc/uptime");
  const uptimeSeconds = parseFloat(uptimeRaw.split(" ")[0] ?? "0");

  const dockerRaw = run(
    "docker stats --no-stream --format '{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.PIDs}}'",
  );
  const containers = dockerRaw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [name, cpu, mem, memPerc, net, pids] = line.split("|");
      return {
        name: name ?? "",
        cpu: cpu ?? "0%",
        mem: mem ?? "0B / 0B",
        memPercent: memPerc ?? "0%",
        net: net ?? "0B / 0B",
        pids: pids ?? "0",
      };
    });

  return {
    server: {
      cpuCores,
      cpuPercent: Math.round(cpuPercent * 100) / 100,
      memTotal,
      memUsed,
      memPercent:
        memTotal > 0
          ? Math.round((memUsed / memTotal) * 10000) / 100
          : 0,
      diskTotal,
      diskUsed,
      diskPercent:
        diskTotal > 0
          ? Math.round((diskUsed / diskTotal) * 10000) / 100
          : 0,
      uptimeSeconds,
    },
    containers,
  };
};

// ─── Deploy ──────────────────────────────────────────────────────────────

const handleDeploy = async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const body = JSON.parse(await readBody(req));
    const { userId, model, communication, aiKeys } = body;

    if (!userId) {
      return json(res, { error: "userId is required" }, 400);
    }

    const crypto = await import("crypto");
    const id = crypto
      .createHash("sha256")
      .update(userId)
      .digest("hex")
      .slice(0, 16);
    const token = crypto.randomBytes(32).toString("base64");

    const PORT_RANGE_START = 20000;
    const PORT_RANGE_END = 40000;
    const numeric = Number.parseInt(id.slice(0, 8), 16);
    const span = PORT_RANGE_END - PORT_RANGE_START + 1;
    const initialPort = PORT_RANGE_START + (numeric % span);

    const DEPLOY_ROOT = process.env.VPS_DEPLOY_ROOT ?? "/opt/openclaw";
    const IMAGE =
      process.env.VPS_OPENCLAW_IMAGE ??
      "ghcr.io/openclaw/openclaw:2026.2.24";
    const CONTAINER_MEMORY = process.env.VPS_CONTAINER_MEMORY ?? "2g";
    const CONTAINER_CPUS = process.env.VPS_CONTAINER_CPUS ?? "1.5";
    const NODE_MAX_OLD_SPACE = process.env.VPS_NODE_MAX_OLD_SPACE_SIZE ?? "1024";
    const INSTANCE_DOMAIN_SUFFIX = process.env.VPS_INSTANCE_DOMAIN_SUFFIX ?? "";

    const stateDir = `${DEPLOY_ROOT}/instances/${id}`;
    const origin = INSTANCE_DOMAIN_SUFFIX
      ? `https://${id}.${INSTANCE_DOMAIN_SUFFIX}`
      : `http://localhost:${initialPort}`;

    const gatewayConfig = {
      model: model ?? "gpt-5.2",
      communication: communication ?? { channel: "telegram" },
      origin,
    };

    const escapeShell = (v: string) => `'${v.replaceAll("'", "'\"'\"'")}'`;

    const script = `
set -euo pipefail

DEPLOY_ROOT=${escapeShell(DEPLOY_ROOT)}
IMAGE=${escapeShell(IMAGE)}
INSTANCE_ID=${escapeShell(id)}
CONTAINER_NAME=${escapeShell(id)}
STATE_DIR=${escapeShell(stateDir)}
INITIAL_PORT=${initialPort}
PORT_RANGE_START=${PORT_RANGE_START}
PORT_RANGE_END=${PORT_RANGE_END}

umask 077
mkdir -p "$DEPLOY_ROOT/instances"
chmod 700 "$DEPLOY_ROOT" "$DEPLOY_ROOT/instances"
mkdir -p "$STATE_DIR"
CONTAINER_UID=$(docker run --rm --entrypoint sh "$IMAGE" -c 'id -u' 2>/dev/null || echo "1000")
CONTAINER_GID=$(docker run --rm --entrypoint sh "$IMAGE" -c 'id -g' 2>/dev/null || echo "1000")
chown -R "$CONTAINER_UID:$CONTAINER_GID" "$STATE_DIR"
chmod 700 "$STATE_DIR"

cat > "$STATE_DIR/openclaw.json" <<JSONEOF
${JSON.stringify(gatewayConfig, null, 2)}
JSONEOF
chown "$CONTAINER_UID:$CONTAINER_GID" "$STATE_DIR/openclaw.json"
chmod 600 "$STATE_DIR/openclaw.json"

PORT="$INITIAL_PORT"
for _ in $(seq 1 128); do
  IS_BUSY=0
  if command -v ss >/dev/null 2>&1 && ss -ltn "( sport = :$PORT )" | grep -q ":$PORT"; then
    IS_BUSY=1
  fi
  if docker ps --format "{{.Ports}}" | grep -qE "(^|[^0-9])$PORT->"; then
    IS_BUSY=1
  fi
  if [ "$IS_BUSY" -eq 0 ]; then
    break
  fi
  PORT=$((PORT + 1))
  if [ "$PORT" -gt "$PORT_RANGE_END" ]; then
    PORT="$PORT_RANGE_START"
  fi
done

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

CONTAINER_ID=$(docker run -d \\
  --name "$CONTAINER_NAME" \\
  --restart unless-stopped \\
  --memory=${escapeShell(CONTAINER_MEMORY)} \\
  --pids-limit="512" \\
  --cpus=${escapeShell(CONTAINER_CPUS)} \\
  --read-only \\
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \\
  -p "127.0.0.1:$PORT:18789" \\
  -v "$STATE_DIR:/opt/openclaw" \\
  -e NODE_OPTIONS=${escapeShell('--max-old-space-size=' + NODE_MAX_OLD_SPACE)} \\
  -e OPENCLAW_HOME="/opt/openclaw" \\
  -e OPENCLAW_STATE_DIR="/opt/openclaw" \\
  -e OPENAI_API_KEY=${escapeShell(aiKeys?.openaiApiKey ?? "")} \\
  -e ANTHROPIC_API_KEY=${escapeShell(aiKeys?.anthropicApiKey ?? "")} \\
  -e GOOGLE_GENERATIVE_AI_API_KEY=${escapeShell(aiKeys?.googleApiKey ?? "")} \\
  "$IMAGE")

echo "container_id=$CONTAINER_ID"
`;

    const result = await new Promise<string>((resolve, reject) => {
      exec(
        `bash -s <<'DEPLOY_SCRIPT'\n${script}\nDEPLOY_SCRIPT`,
        { timeout: 120000 },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Deploy failed: ${stderr || error.message}`));
            return;
          }
          resolve(stdout);
        },
      );
    });

    console.log(`[deploy] Instance ${id} deployed successfully`);

    return json(res, { id, token });
  } catch (err: any) {
    console.error(`[deploy] Error:`, err.message);
    return json(res, { error: err.message }, 500);
  }
};

// ─── Server ──────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  const url = req.url ?? "/";
  const method = req.method ?? "GET";

  // Health check (no auth)
  if (url === "/health" && method === "GET") {
    return json(res, { status: "ok" });
  }

  // Auth required for everything else
  if (!authenticate(req)) {
    return json(res, { error: "Unauthorized" }, 401);
  }

  if (url === "/stats" && method === "GET") {
    try {
      return json(res, collectStats());
    } catch (err: any) {
      return json(res, { error: err.message }, 500);
    }
  }

  if (url === "/deploy" && method === "POST") {
    return handleDeploy(req, res);
  }

  json(res, { error: "Not Found" }, 404);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[vps-agent] Listening on port ${PORT}`);
  console.log(`[vps-agent] Endpoints: GET /health, GET /stats, POST /deploy`);
});
