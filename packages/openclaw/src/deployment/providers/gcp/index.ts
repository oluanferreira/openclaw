import { getGatewayConfig } from "../../../config/gateway";
import { escapeShell, getGatewayToken, getInstanceId } from "../../utils";

import { env as gcpEnv } from "./env";
import { executeOnInstance, instancesClient } from "./sdk";

import type { DeployInstanceSchemaInput } from "../../schema";
import type { OpenClawDeploymentProviderStrategy } from "../types";

const getUrl = (id: string, token?: string) =>
  `https://${id}.${gcpEnv.GCP_INSTANCE_DOMAIN_SUFFIX}${token ? `/#token=${encodeURIComponent(token)}` : ""}`;

const getStartupScript = (
  params: DeployInstanceSchemaInput & {
    id: string;
    token: string;
  },
) => {
  const origin = getUrl(params.id);

  return `#!/usr/bin/env bash
set -euo pipefail

OPENCLAW_STATE_DIR=${escapeShell(gcpEnv.GCP_OPENCLAW_STATE_DIR)}

mkdir -p "$OPENCLAW_STATE_DIR"
chmod 755 "$OPENCLAW_STATE_DIR"

cat > "$OPENCLAW_STATE_DIR/openclaw.json" <<'OCFG'
${JSON.stringify(getGatewayConfig({ origin, ...params }), null, 2)}
OCFG
chmod 644 "$OPENCLAW_STATE_DIR/openclaw.json"

pkill -f "openclaw gateway" 2>/dev/null || true
export OPENCLAW_STATE_DIR
nohup openclaw gateway &
`;
};

export const strategy = {
  deploy: async ({
    userId,
    ...input
  }: DeployInstanceSchemaInput & { userId: string }) => {
    const id = getInstanceId(userId);
    const token = getGatewayToken();

    const startupScript = getStartupScript({
      id,
      token,
      ...input,
    });

    const [operation] = await instancesClient.insert({
      project: gcpEnv.GCP_PROJECT_ID,
      zone: gcpEnv.GCP_ZONE,
      sourceInstanceTemplate: `projects/${gcpEnv.GCP_PROJECT_ID}/global/instanceTemplates/${gcpEnv.GCP_INSTANCE_TEMPLATE_NAME}`,
      instanceResource: {
        name: id,
        metadata: {
          items: [
            { key: "startup-script", value: startupScript },
            { key: "enable-oslogin", value: "TRUE" },
          ],
        },
      },
    });

    if (!operation.name) {
      throw new Error("Could not create GCP instance.");
    }

    return {
      id,
      token,
    };
  },
  getStatus: async (id) => {
    const [instance] = await instancesClient.get({
      project: gcpEnv.GCP_PROJECT_ID,
      zone: gcpEnv.GCP_ZONE,
      instance: id,
    });

    return {
      status: instance.status?.toLowerCase() ?? null,
    };
  },
  cli: async (id, commandArgs) => executeOnInstance(id, commandArgs),
  start: async (id) => {
    await instancesClient.start({
      project: gcpEnv.GCP_PROJECT_ID,
      zone: gcpEnv.GCP_ZONE,
      instance: id,
    });
  },
  stop: async (id) => {
    await instancesClient.stop({
      project: gcpEnv.GCP_PROJECT_ID,
      zone: gcpEnv.GCP_ZONE,
      instance: id,
    });
  },
  restart: async (id) => {
    await instancesClient.reset({
      project: gcpEnv.GCP_PROJECT_ID,
      zone: gcpEnv.GCP_ZONE,
      instance: id,
    });
  },
  destroy: async (id) => {
    await instancesClient.delete({
      project: gcpEnv.GCP_PROJECT_ID,
      zone: gcpEnv.GCP_ZONE,
      instance: id,
    });
  },
  getLogs: async (id) => executeOnInstance(id, ["logs", "--limit", "500"]),
  getUrl,
} satisfies OpenClawDeploymentProviderStrategy;
