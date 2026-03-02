import { MODELS } from "./ai";
import { env as aiEnv } from "./ai/env";
import { CommunicatonChannel } from "./communication";

import type { Model } from "./ai";
import type { OpenclawConfig } from "./schema";

const TRUSTED_PROXIES = ["127.0.0.1", "::1", "172.17.0.1"];
const GATEWAY_PORT = 18789;

const toAgentModelId = (model: Model) => {
  const modelInfo = MODELS.find((m) => m.id === model);

  if (!modelInfo) {
    throw new Error(`Model ${model} not found.`);
  }

  return `${modelInfo.provider}/${modelInfo.id}`;
};

interface GatewayConfigInput {
  origin: string;
  token: string;
}

export const getGatewayConfig = ({
  origin,
  token,
  ...config
}: OpenclawConfig & GatewayConfigInput) => ({
  gateway: {
    mode: "local",
    bind: "lan",
    port: GATEWAY_PORT,
    trustedProxies: TRUSTED_PROXIES,
    controlUi: {
      enabled: true,
      allowedOrigins: [origin],
    },
    auth: {
      mode: "token",
      token,
    },
  },
  env: {
    OPENAI_API_KEY: aiEnv.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: aiEnv.ANTHROPIC_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: aiEnv.GOOGLE_GENERATIVE_AI_API_KEY,
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
