import { MODELS } from "./ai";
import { CommunicatonChannel } from "./communication";

import type { Model } from "./ai";
import type { OpenclawConfig } from "./schema";

const TRUSTED_PROXIES = ["127.0.0.1", "::1", "172.17.0.1"];

const toAgentModelId = (model: Model) => {
  const modelInfo = MODELS.find((m) => m.id === model);

  if (!modelInfo) {
    throw new Error(`Model ${model} not found.`);
  }

  return `${modelInfo.provider}/${modelInfo.id}`;
};

interface GatewayConfigInput {
  origin: string;
  userId: string;
}

export const getGatewayConfig = ({
  origin,
  userId,
  ...config
}: OpenclawConfig & GatewayConfigInput) => ({
  gateway: {
    mode: "local",
    bind: "lan",
    controlUi: {
      enabled: true,
      allowedOrigins: [origin],
    },
    trustedProxies: TRUSTED_PROXIES,
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
        allowUsers: [userId],
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: toAgentModelId(config.model),
      },
    },
  },
  channels: {
    telegram: {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      enabled: config.communication.channel === CommunicatonChannel.TELEGRAM,
      botToken: config.communication.token,
    },
  },
});
