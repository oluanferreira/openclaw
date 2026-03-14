import { createHash, randomBytes } from "node:crypto";

import { getGatewayConfig } from "../../../config/gateway";

import { getProvisionRouteScript } from "./caddy";
import { env as vpsEnv } from "./env";
import { execute, parseOutput, escapeShell } from "./sdk";
import { getStatus } from "./status";
import { getToolsMd } from "./tools-md";

import type { DeployInstanceSchemaInput, AiKeysInput } from "../../schema";
import type { OpenClawDeploymentProviderStrategy } from "../types";

const PORT_RANGE_START = 20000;
const PORT_RANGE_END = 40000;

const toInstanceId = (userId: string) =>
  createHash("sha256").update(userId).digest("hex").slice(0, 16);

const toInitialPort = (instanceId: string) => {
  const numeric = Number.parseInt(instanceId.slice(0, 8), 16);
  const span = PORT_RANGE_END - PORT_RANGE_START + 1;
  return PORT_RANGE_START + (numeric % span);
};

const toStateDir = (instanceId: string) =>
  `${vpsEnv.VPS_DEPLOY_ROOT}/instances/${instanceId}`;

const getUrl = (id: string, token?: string) =>
  `https://${id}.${vpsEnv.VPS_INSTANCE_DOMAIN_SUFFIX}${token ? `/#token=${encodeURIComponent(token)}` : ""}`;

const getGatewayToken = () => randomBytes(32).toString("hex");

const toEscapedCommand = (args: readonly string[]) =>
  args.map((arg) => escapeShell(arg)).join(" ");

const executeDocker = (args: readonly string[]) =>
  execute(`docker ${toEscapedCommand(args)}`);

const getDockerRunCommand = (params: {
  id: string;
  port: number | string;
  aiKeys?: AiKeysInput;
  gatewayToken?: string;
}) => {
  const stateDir = toStateDir(params.id);
  return `docker run -d \
  --name ${escapeShell(params.id)} \
  --restart unless-stopped \
  --memory=${escapeShell(vpsEnv.VPS_CONTAINER_MEMORY)} \
  --pids-limit="512" \
  --cpus=${escapeShell(vpsEnv.VPS_CONTAINER_CPUS)} \
  --read-only \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  -p "127.0.0.1:${params.port}:18789" \
  -v ${escapeShell(`${stateDir}:/opt/openclaw`)} \
  -e NODE_OPTIONS=${escapeShell(
    `--max-old-space-size=${vpsEnv.VPS_NODE_MAX_OLD_SPACE_SIZE}`,
  )} \
  -e PATH="/opt/openclaw/.local/bin:/opt/openclaw/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin" \
  -e OPENCLAW_HOME="/opt/openclaw" \
  -e OPENCLAW_STATE_DIR="/opt/openclaw" \
  -e HOME="/opt/openclaw" \
  -e OPENCLAW_GATEWAY_TOKEN=${escapeShell(params.gatewayToken ?? "")} \
  -e OPENAI_API_KEY=${escapeShell(params.aiKeys?.openaiApiKey ?? "")} \
  -e ANTHROPIC_API_KEY=${escapeShell(params.aiKeys?.anthropicApiKey ?? "")} \
  -e GOOGLE_GENERATIVE_AI_API_KEY=${escapeShell(params.aiKeys?.googleApiKey ?? "")} \
  ${escapeShell(vpsEnv.VPS_OPENCLAW_IMAGE)}`;
};

const getDeploymentScript = (
  params: DeployInstanceSchemaInput & {
    id: string;
    port: number;
    token: string;
    hooksToken: string;
    userId: string;
  },
) => {
  const origin = getUrl(params.id);

  return `
set -euo pipefail

DEPLOY_ROOT=${escapeShell(vpsEnv.VPS_DEPLOY_ROOT)}
IMAGE=${escapeShell(vpsEnv.VPS_OPENCLAW_IMAGE)}
INSTANCE_ID=${escapeShell(params.id)}
CONTAINER_NAME=${escapeShell(params.id)}
STATE_DIR=${escapeShell(toStateDir(params.id))}
INITIAL_PORT=${params.port}
PORT_RANGE_START=${PORT_RANGE_START}
PORT_RANGE_END=${PORT_RANGE_END}

umask 077
mkdir -p "$DEPLOY_ROOT/instances"
chmod 700 "$DEPLOY_ROOT" "$DEPLOY_ROOT/instances"
mkdir -p "$STATE_DIR"
mkdir -p "$STATE_DIR/bin"
CONTAINER_UID=$(docker run --rm --entrypoint sh "$IMAGE" -c 'id -u' 2>/dev/null || echo "1000")
CONTAINER_GID=$(docker run --rm --entrypoint sh "$IMAGE" -c 'id -g' 2>/dev/null || echo "1000")
chown -R "$CONTAINER_UID:$CONTAINER_GID" "$STATE_DIR"
chmod 700 "$STATE_DIR"

cat > "$STATE_DIR/openclaw.json" <<EOF
${JSON.stringify(getGatewayConfig({ origin, ...params }), null, 2)}
EOF
chown "$CONTAINER_UID:$CONTAINER_GID" "$STATE_DIR/openclaw.json"
chmod 600 "$STATE_DIR/openclaw.json"

# Install clawhub CLI into container writable path
mkdir -p "$STATE_DIR/.local" "$STATE_DIR/.npm" "$STATE_DIR/skills"
NPM_CONFIG_PREFIX="$STATE_DIR/.local" NPM_CONFIG_CACHE="$STATE_DIR/.npm" npm install -g clawhub --loglevel=error >/dev/null 2>&1 || true
chown -R "$CONTAINER_UID:$CONTAINER_GID" "$STATE_DIR/.local" "$STATE_DIR/.npm" "$STATE_DIR/skills" "$STATE_DIR/.clawhub" 2>/dev/null || true

# Create workspace with ClaWin1Click context (only TOOLS.md — other files use OpenClaw defaults)
mkdir -p "$STATE_DIR/.openclaw/workspace"

cat > "$STATE_DIR/.openclaw/workspace/TOOLS.md" << 'TOOLSEOF'
${getToolsMd(params.locale)}
TOOLSEOF

chown -R "$CONTAINER_UID:$CONTAINER_GID" "$STATE_DIR/.openclaw"

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

CONTAINER_ID=$(${getDockerRunCommand({ id: params.id, port: "$PORT", aiKeys: params.aiKeys, gatewayToken: params.token })})
${getProvisionRouteScript(params.id, params.token)}

echo "container_id=$CONTAINER_ID"
`;
};

const getUpdateKeysScript = (
  id: string,
  aiKeys: AiKeysInput,
  model?: string,
  token?: string,
) => {
  const STATE_DIR = toStateDir(id);
  const origin = getUrl(id);

  return `
set -euo pipefail

NEW_MODEL=${escapeShell(model ?? "")}
STATE_DIR=${escapeShell(STATE_DIR)}
GATEWAY_TOKEN=${escapeShell(token ?? "")}
ALLOWED_ORIGIN=${escapeShell(origin)}

# Update openclaw.json: model (if provided) + restore gateway token (prevents redaction corruption)
python3 -c "
import json, sys
cfg_path = sys.argv[1] + '/openclaw.json'
new_model = sys.argv[2]
gateway_token = sys.argv[3]
allowed_origin = sys.argv[4]

with open(cfg_path) as f:
    cfg = json.load(f)

if new_model:
    cfg.setdefault('agents', {}).setdefault('defaults', {}).setdefault('model', {})['primary'] = new_model

if gateway_token:
    cfg.setdefault('gateway', {}).setdefault('auth', {})['token'] = gateway_token
    cfg['gateway']['auth']['mode'] = 'token'
    cfg['gateway'].setdefault('controlUi', {})['allowedOrigins'] = [allowed_origin]

with open(cfg_path, 'w') as f:
    json.dump(cfg, f, indent=2)
" "$STATE_DIR" "$NEW_MODEL" "$GATEWAY_TOKEN" "$ALLOWED_ORIGIN"

# Get the current host port from the running container
PORT=$(docker inspect --format '{{range $p, $conf := .HostConfig.PortBindings}}{{(index $conf 0).HostPort}}{{end}}' ${escapeShell(id)})

if [ -z "$PORT" ]; then
  echo "ERROR: Could not determine container port" >&2
  exit 1
fi

# Stop and remove the existing container
docker stop ${escapeShell(id)}
docker rm ${escapeShell(id)}

# Recreate with new env vars (Caddy route and state dir stay intact)
CONTAINER_ID=$(${getDockerRunCommand({ id, port: "$PORT", aiKeys, gatewayToken: token })})

echo "container_id=$CONTAINER_ID"
`;
};

export const strategy = {
  deploy: async ({
    userId,
    ...input
  }: DeployInstanceSchemaInput & { userId: string }) => {
    const id = toInstanceId(userId);
    const port = toInitialPort(id);
    const token = getGatewayToken();
    const hooksToken = getGatewayToken();
    const script = getDeploymentScript({
      id,
      port,
      userId,
      token,
      hooksToken,
      ...input,
    });

    const { stdout } = await execute(script);

    const output = parseOutput(stdout);

    if (!output.container_id) {
      throw new Error("Deployment returned an invalid result.");
    }

    return {
      id,
      token,
    };
  },
  getStatus,
  cli: async (id, commandArgs) =>
    executeDocker(["exec", id, "node", "dist/index.js", ...commandArgs]),
  start: async (id) => executeDocker(["start", id]),
  stop: async (id) => executeDocker(["stop", id]),
  restart: async (id) => executeDocker(["restart", id]),
  destroy: async (id) => executeDocker(["rm", "-f", id]),
  getLogs: async (id) =>
    execute(
      `docker logs --timestamps --details --tail 500 ${escapeShell(id)} 2>&1`,
    ),
  getUrl,
  updateKeys: async (
    id: string,
    aiKeys: AiKeysInput,
    model?: string,
    token?: string,
  ) => {
    const script = getUpdateKeysScript(id, aiKeys, model, token);
    return execute(script);
  },
} satisfies OpenClawDeploymentProviderStrategy;
export {
  findToolBinary,
  downloadSkillBinary,
  readOpenclawJson,
  updateOpenclawJson,
  restartContainer,
  gogSetupStep1,
  gogSetupStep2,
  updateToolsMd,
} from "./sdk";
export { clawhubExec } from "./clawhub";
