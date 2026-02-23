import { createHash, randomBytes } from "node:crypto";

import { MODELS } from "../../../ai";
import { env as aiEnv } from "../../../ai/env";
import { CommunicationChannelEnvironmentVariable } from "../../../communication";

import { getInstanceUrl, getProvisionRouteScript } from "./caddy";
import { env as vpsEnv } from "./env";
import { execute, parseOutput, escapeShell } from "./sdk";
import { getStatus } from "./status";

import type { Model } from "../../../ai";
import type { CommunicationChannelConfig } from "../../../communication";
import type { DeployInstanceSchemaInput } from "../../schema";
import type { OpenClawDeploymentProviderStrategy } from "../types";

const PORT_RANGE_START = 20000;
const PORT_RANGE_END = 40000;

const getGatewayToken = () => randomBytes(32).toString("hex");

const toInstanceId = (userId: string) =>
  createHash("sha256").update(userId).digest("hex").slice(0, 16);

const toInitialPort = (instanceId: string) => {
  const numeric = Number.parseInt(instanceId.slice(0, 8), 16);
  const span = PORT_RANGE_END - PORT_RANGE_START + 1;
  return PORT_RANGE_START + (numeric % span);
};

const toStateDir = (instanceId: string) =>
  `${vpsEnv.VPS_DEPLOY_ROOT}/instances/${instanceId}`;

const toModelScriptValue = (model: Model) => {
  const modelInfo = MODELS.find((m) => m.id === model);

  if (!modelInfo) {
    throw new Error(`Model ${model} not found.`);
  }

  return `MODEL_PROVIDER=${escapeShell(modelInfo.provider)}
MODEL_ID=${escapeShell(modelInfo.id)}`;
};

const toCommunicationChannelScriptValue = (
  communication: CommunicationChannelConfig,
) => {
  const environmentVariable =
    CommunicationChannelEnvironmentVariable[communication.channel];

  return `${environmentVariable}=${escapeShell(communication.token)}`;
};

const getDeploymentScript = (
  params: DeployInstanceSchemaInput & {
    id: string;
    port: number;
    token: string;
  },
) => {
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
GATEWAY_TOKEN=${escapeShell(params.token)}
${toModelScriptValue(params.model)}
${toCommunicationChannelScriptValue(params.communication)}

umask 077
mkdir -p "$DEPLOY_ROOT/instances"
chmod 700 "$DEPLOY_ROOT" "$DEPLOY_ROOT/instances"
mkdir -p "$STATE_DIR"
CONTAINER_UID=$(docker run --rm --entrypoint sh "$IMAGE" -c 'id -u' 2>/dev/null || echo "1000")
CONTAINER_GID=$(docker run --rm --entrypoint sh "$IMAGE" -c 'id -g' 2>/dev/null || echo "1000")
chown -R "$CONTAINER_UID:$CONTAINER_GID" "$STATE_DIR"
chmod 700 "$STATE_DIR"

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
  -p "127.0.0.1:$PORT:7777" \
  -v "$STATE_DIR:/opt/openclaw" \
  -e NODE_OPTIONS=${escapeShell(
    `--max-old-space-size=${vpsEnv.VPS_NODE_MAX_OLD_SPACE_SIZE}`,
  )} \
  -e OPENCLAW_HOME="/opt/openclaw" \
  -e OPENCLAW_STATE_DIR="/opt/openclaw" \
  -e OPENCLAW_GATEWAY_BIND="lan" \
  -e OPENCLAW_GATEWAY_PORT="7777" \
  -e OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN" \
  -e OPENCLAW_MODEL_PROVIDER="$MODEL_PROVIDER" \
  -e OPENCLAW_MODEL="$MODEL_ID" \
  -e TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" \
  -e OPENAI_API_KEY=${escapeShell(aiEnv.OPENAI_API_KEY)} \
  -e ANTHROPIC_API_KEY=${escapeShell(aiEnv.ANTHROPIC_API_KEY)} \
  -e GOOGLE_GENERATIVE_AI_API_KEY=${escapeShell(aiEnv.GOOGLE_GENERATIVE_AI_API_KEY)} \
  "$IMAGE" \
  node dist/index.js gateway --bind lan --port 7777)
${getProvisionRouteScript(params.id)}

echo "container_id=$CONTAINER_ID"
echo "gateway_port=$PORT"
echo "log_path=$STATE_DIR/logs"
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
    const script = getDeploymentScript({ id, port, token, ...input });

    const { stdout } = await execute(script);

    const output = parseOutput(stdout);
    const resolvedGatewayPort = Number(output.gateway_port);

    if (
      !output.container_id ||
      !Number.isFinite(resolvedGatewayPort) ||
      !output.log_path
    ) {
      throw new Error("Deployment returned an invalid result.");
    }

    return {
      id,
      url: output.instance_url ?? getInstanceUrl(id),
    };
  },
  getStatus,
} satisfies OpenClawDeploymentProviderStrategy;
