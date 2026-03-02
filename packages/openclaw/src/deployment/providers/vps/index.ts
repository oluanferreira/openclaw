import { getGatewayConfig } from "../../../config/gateway";
import {
  escapeShell,
  getGatewayToken,
  getInstanceId,
  toEscapedCommand,
} from "../../utils";

import { getProvisionRouteScript } from "./caddy";
import { env as vpsEnv } from "./env";
import { execute, parseOutput } from "./sdk";
import { getStatus } from "./status";

import type { DeployInstanceSchemaInput } from "../../schema";
import type { OpenClawDeploymentProviderStrategy } from "../types";

const PORT_RANGE_START = 20000;
const PORT_RANGE_END = 40000;

const toRandomPort = () => {
  const span = PORT_RANGE_END - PORT_RANGE_START + 1;
  return PORT_RANGE_START + Math.floor(Math.random() * span);
};

const toStateDir = (instanceId: string) =>
  `${vpsEnv.VPS_OPENCLAW_STATE_DIR}/instances/${instanceId}`;

export const getUrl = (id: string, token?: string) =>
  `https://${id}.${vpsEnv.VPS_INSTANCE_DOMAIN_SUFFIX}${token ? `/#token=${encodeURIComponent(token)}` : ""}`;

const executeDocker = (args: readonly string[]) =>
  execute(`docker ${toEscapedCommand(args)}`);

const getDeploymentScript = (
  params: DeployInstanceSchemaInput & {
    id: string;
    port: number;
    token: string;
    userId: string;
  },
) => {
  const origin = getUrl(params.id);
  const { gateway } = getGatewayConfig({ origin, ...params });

  return `
set -euo pipefail

IMAGE=${escapeShell(vpsEnv.VPS_OPENCLAW_IMAGE)}
INSTANCE_ID=${escapeShell(params.id)}
CONTAINER_NAME=${escapeShell(params.id)}
OPENCLAW_STATE_DIR=${escapeShell(vpsEnv.VPS_OPENCLAW_STATE_DIR)}
STATE_DIR=${escapeShell(toStateDir(params.id))}
INITIAL_PORT=${params.port}
PORT_RANGE_START=${PORT_RANGE_START}
PORT_RANGE_END=${PORT_RANGE_END}

umask 077
mkdir -p "$STATE_DIR"
chown -R 1000:1000 "$STATE_DIR"
chmod 700 "$OPENCLAW_STATE_DIR" "$OPENCLAW_STATE_DIR/instances"
chmod 700 "$STATE_DIR"

cat > "$STATE_DIR/openclaw.json" <<EOF
${JSON.stringify(getGatewayConfig({ origin, ...params }), null, 2)}
EOF
chown 1000:1000 "$STATE_DIR/openclaw.json"
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

CONTAINER_ID=$(docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  --memory=${escapeShell(vpsEnv.VPS_CONTAINER_MEMORY)} \
  --pids-limit="512" \
  --cpus=${escapeShell(vpsEnv.VPS_CONTAINER_CPUS)} \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  -p "127.0.0.1:$PORT:${gateway.port}" \
  -v "$STATE_DIR:/opt/openclaw" \
  -e NODE_OPTIONS=${escapeShell(
    `--max-old-space-size=${vpsEnv.VPS_NODE_MAX_OLD_SPACE_SIZE}`,
  )} \
  -e OPENCLAW_HOME="/opt/openclaw" \
  -e OPENCLAW_STATE_DIR="/opt/openclaw" \
  "$IMAGE")
${getProvisionRouteScript(params.id)}

echo "container_id=$CONTAINER_ID"
`;
};

export const strategy = {
  deploy: async ({
    userId,
    ...input
  }: DeployInstanceSchemaInput & { userId: string }) => {
    const id = getInstanceId(userId);
    const port = toRandomPort();
    const token = getGatewayToken();
    const script = getDeploymentScript({
      id,
      port,
      userId,
      token,
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
    execute(`docker logs --timestamps --details ${escapeShell(id)} 2>&1`),
  getUrl,
} satisfies OpenClawDeploymentProviderStrategy;
