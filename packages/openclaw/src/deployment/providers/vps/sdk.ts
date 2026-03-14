import { Client } from "ssh2";

import { env } from "./env";

import type { ClientChannel } from "ssh2";

interface RunRemoteScriptOptions {
  timeout?: number;
}

export interface RunRemoteScriptResult {
  stdout: string;
  stderr: string;
}

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

const normalizePrivateKey = (value: string) => value.replaceAll("\\n", "\n");

export const execute = async (
  script: string,
  options?: RunRemoteScriptOptions,
): Promise<RunRemoteScriptResult> => {
  const client = new Client();
  const stdout: string[] = [];
  const stderr: string[] = [];

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.end();
      reject(new Error("Remote command timed out."));
    }, options?.timeout ?? DEFAULT_TIMEOUT_MS);

    const fail = (error: Error) => {
      clearTimeout(timeout);
      reject(error);
    };

    client
      .on("ready", () => {
        client.exec(
          "bash -s",
          (error: Error | undefined, stream: ClientChannel) => {
            if (error) {
              fail(error);
              return;
            }

            stream.on("close", (code: number | undefined) => {
              clearTimeout(timeout);
              client.end();

              if (code === 0) {
                resolve();
                return;
              }

              reject(
                new Error(
                  `Remote command failed with exit code ${code ?? -1}. ${stderr.join("") || stdout.join("")}`.trim(),
                ),
              );
            });

            stream.on("data", (chunk: Buffer) => {
              stdout.push(chunk.toString("utf8"));
            });

            stream.stderr.on("data", (chunk: Buffer) => {
              stderr.push(chunk.toString("utf8"));
            });

            stream.end(script);
          },
        );
      })
      .on("error", fail)
      .connect({
        host: env.VPS_HOST,
        port: env.VPS_SSH_PORT,
        username: env.VPS_USER,
        privateKey: normalizePrivateKey(env.VPS_PRIVATE_KEY),
        passphrase: env.VPS_PRIVATE_KEY_PASSPHRASE,
      });
  });

  return {
    stdout: stdout.join(""),
    stderr: stderr.join(""),
  };
};

export const parseOutput = (stdout: string) => {
  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const pairs = lines.map((line) => {
    const separator = line.indexOf("=");
    if (separator <= 0) {
      return null;
    }
    return [line.slice(0, separator), line.slice(separator + 1)] as const;
  });

  return Object.fromEntries(
    pairs.filter((pair): pair is readonly [string, string] => Boolean(pair)),
  );
};

export const escapeShell = (value: string) =>
  `'${value.replaceAll("'", "'\"'\"'")}'`;

export const notifyAgent = async (
  instanceId: string,
  message: string,
): Promise<void> => {
  const stateDir = `${env.VPS_DEPLOY_ROOT}/instances/${instanceId}`;
  const escapedMsg = escapeShell(
    JSON.stringify({ message, name: "system", wakeMode: "always" }),
  );

  const script = `
PORT=$(docker inspect --format '{{range $p, $conf := .HostConfig.PortBindings}}{{(index $conf 0).HostPort}}{{end}}' ${escapeShell(instanceId)} 2>/dev/null || echo "")
if [ -z "$PORT" ]; then exit 0; fi
TOKEN=$(python3 -c "import json; c=json.load(open('${stateDir}/openclaw.json')); print(c.get('hooks',{}).get('token',''))" 2>/dev/null || echo "")
if [ -z "$TOKEN" ]; then exit 0; fi
curl -s --max-time 5 -X POST "http://127.0.0.1:$PORT/hooks/agent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d ${escapedMsg} || true
`.trim();

  try {
    await execute(script, { timeout: 30_000 });
  } catch {
    // best-effort — don't block caller
  }
};

export const destroyInstanceFull = async (
  instanceId: string,
): Promise<void> => {
  const escaped = escapeShell(instanceId);
  const routeFile = `${env.VPS_CADDY_ROUTES_DIR}/${instanceId}${env.VPS_INSTANCE_DOMAIN_SUFFIX}.caddy`;
  const stateDir = `${env.VPS_DEPLOY_ROOT}/instances/${instanceId}`;

  const script = `
docker rm -f ${escaped} 2>/dev/null || true
rm -f ${escapeShell(routeFile)}
caddy reload --config ${escapeShell(env.VPS_CADDY_CONFIG_PATH)} 2>/dev/null || true
rm -rf ${escapeShell(stateDir)}
`.trim();

  await execute(script, { timeout: 60_000 });
};

/**
 * Restarts a container, optionally re-injecting the gateway token first.
 *
 * OpenClaw may redact the gateway token from openclaw.json after startup.
 * If the container restarts after redaction, the token is lost and all
 * webchat connections fail with "token_mismatch". Always pass the token
 * to guarantee it survives restarts.
 */
export const restartContainer = async (
  instanceId: string,
  opts?: { gatewayToken?: string },
): Promise<void> => {
  if (opts?.gatewayToken) {
    await updateOpenclawJson(instanceId, {
      gateway: { auth: { token: opts.gatewayToken, mode: "token" } },
    });
  }
  await execute(`docker restart ${escapeShell(instanceId)}`);
};

export const readOpenclawJson = async (
  instanceId: string,
): Promise<Record<string, unknown>> => {
  const stateDir = `${env.VPS_DEPLOY_ROOT}/instances/${instanceId}`;
  const configPath = `${stateDir}/openclaw.json`;
  const { stdout } = await execute(
    `cat ${escapeShell(configPath)} 2>/dev/null || echo "{}"`,
    { timeout: 15_000 },
  );
  return JSON.parse(stdout.trim() || "{}") as Record<string, unknown>;
};

/**
 * Surgically deep-merges a patch into the instance's openclaw.json.
 *
 * Uses Python on the VPS to merge only the specified keys, leaving all
 * other fields (including container-redacted tokens/secrets) untouched.
 * This prevents the `_OPENCLAW_REDACTED_` placeholder from overwriting
 * real values when the container redacts sensitive fields in-place.
 */
export const updateOpenclawJson = async (
  instanceId: string,
  patch: Record<string, unknown>,
): Promise<void> => {
  const stateDir = `${env.VPS_DEPLOY_ROOT}/instances/${instanceId}`;
  const _configPath = `${stateDir}/openclaw.json`;
  const patchB64 = Buffer.from(JSON.stringify(patch)).toString("base64");

  await execute(`python3 << 'PYEOF'
import json, base64

config_path = "${stateDir}/openclaw.json"
patch = json.loads(base64.b64decode("${patchB64}").decode())

with open(config_path) as f:
    config = json.load(f)

def deep_merge(base, update):
    for key, value in update.items():
        if isinstance(value, dict) and isinstance(base.get(key), dict):
            deep_merge(base[key], value)
        else:
            base[key] = value

deep_merge(config, patch)

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)
PYEOF`);
};

export const findToolBinary = async (
  instanceId: string,
  toolName: string,
): Promise<string | null> => {
  const stateDir = `${env.VPS_DEPLOY_ROOT}/instances/${instanceId}`;
  const toolsDir = `${stateDir}/.openclaw/tools/${toolName}`;

  try {
    const { stdout } = await execute(
      `find ${escapeShell(toolsDir)} -name ${escapeShell(toolName)} -type f -executable 2>/dev/null | head -1`,
      { timeout: 10_000 },
    );
    const path = stdout.trim();
    return path || null;
  } catch {
    return null;
  }
};

export const downloadSkillBinary = async (
  instanceId: string,
  binaryName: string,
): Promise<{ success: boolean; error?: string }> => {
  const stateDir = `${env.VPS_DEPLOY_ROOT}/instances/${instanceId}`;
  const clawhub = `${stateDir}/.local/bin/clawhub`;

  try {
    // Install the skill via clawhub (the runtime will manage the binary)
    const script = `
export HOME=${escapeShell(stateDir)}
if [ ! -f ${escapeShell(clawhub)} ]; then
  echo "clawhub_not_found"
  exit 1
fi
${escapeShell(clawhub)} install ${escapeShell(binaryName)} --workdir ${escapeShell(stateDir)} --dir skills --no-input 2>&1
`.trim();
    await execute(script, { timeout: 120_000 });
    return { success: true };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return { success: false, error: errMsg };
  }
};

export const gogSetupStep1 = async (
  instanceId: string,
  clientSecret: string,
  email: string,
  keyringPassword: string,
): Promise<{ authUrl: string }> => {
  const stateDir = `${env.VPS_DEPLOY_ROOT}/instances/${instanceId}`;

  const script = `
GOG_BIN=$(find ${escapeShell(`${stateDir}/.openclaw/tools/gogcli`)} -name gog -type f -executable 2>/dev/null | head -1)
if [ -z "$GOG_BIN" ]; then
  # Fallback to .local/bin
  GOG_BIN=${escapeShell(`${stateDir}/.local/bin/gog`)}
fi
if [ ! -f "$GOG_BIN" ]; then
  echo "gog binary not found"
  exit 1
fi
export KEYRING_PASSWORD=${escapeShell(keyringPassword)}
export GOG_DATA_DIR=${escapeShell(`${stateDir}/.gog`)}
mkdir -p "$GOG_DATA_DIR"
cat > "$GOG_DATA_DIR/client_secret.json" << 'CLIENT_SECRET_EOF'
${clientSecret}
CLIENT_SECRET_EOF
"$GOG_BIN" auth setup --email ${escapeShell(email)} --client-secret "$GOG_DATA_DIR/client_secret.json" --data-dir "$GOG_DATA_DIR" 2>&1
`.trim();

  const { stdout } = await execute(script, { timeout: 60_000 });
  const urlMatch = /https:\/\/accounts\.google\.com\/[^\s]+/.exec(stdout);
  if (!urlMatch) {
    throw new Error(
      `Could not extract auth URL from output: ${stdout.slice(0, 500)}`,
    );
  }
  return { authUrl: urlMatch[0] };
};

export const gogSetupStep2 = async (
  instanceId: string,
  email: string,
  callbackUrl: string,
  keyringPassword: string,
): Promise<{ account: string }> => {
  const stateDir = `${env.VPS_DEPLOY_ROOT}/instances/${instanceId}`;

  const script = `
GOG_BIN=$(find ${escapeShell(`${stateDir}/.openclaw/tools/gogcli`)} -name gog -type f -executable 2>/dev/null | head -1)
if [ -z "$GOG_BIN" ]; then
  GOG_BIN=${escapeShell(`${stateDir}/.local/bin/gog`)}
fi
if [ ! -f "$GOG_BIN" ]; then
  echo "gog binary not found"
  exit 1
fi
export KEYRING_PASSWORD=${escapeShell(keyringPassword)}
export GOG_DATA_DIR=${escapeShell(`${stateDir}/.gog`)}
"$GOG_BIN" auth callback --url ${escapeShell(callbackUrl)} --data-dir "$GOG_DATA_DIR" 2>&1
`.trim();

  const { stdout: _stdout } = await execute(script, { timeout: 60_000 });
  return { account: email };
};

export const updateToolsMd = async (
  instanceId: string,
  bridgeSection: string | null,
): Promise<void> => {
  const stateDir = `${env.VPS_DEPLOY_ROOT}/instances/${instanceId}`;
  const toolsPath = `${stateDir}/.openclaw/workspace/TOOLS.md`;
  const sectionB64 = bridgeSection
    ? Buffer.from(bridgeSection).toString("base64")
    : "";

  await execute(
    `python3 << 'PYEOF'
import base64

tools_path = "${toolsPath}"
section_b64 = "${sectionB64}"

START_MARKER = "<!-- BRIDGE-TOOLS-START -->"
END_MARKER = "<!-- BRIDGE-TOOLS-END -->"

with open(tools_path) as f:
    content = f.read()

start_idx = content.find(START_MARKER)
end_idx = content.find(END_MARKER)
if start_idx != -1 and end_idx != -1:
    content = content[:start_idx].rstrip() + content[end_idx + len(END_MARKER):].lstrip()

if section_b64:
    section = base64.b64decode(section_b64).decode()
    content = content.rstrip() + "\\n\\n" + START_MARKER + "\\n" + section + "\\n" + END_MARKER + "\\n"
else:
    content = content.rstrip() + "\\n"

with open(tools_path, "w") as f:
    f.write(content)
PYEOF`,
    { timeout: 15_000 },
  );
};
