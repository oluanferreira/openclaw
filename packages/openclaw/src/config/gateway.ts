import { MODELS } from "./ai";
import { CommunicatonChannel } from "./communication";

import type { OpenclawConfig } from "./schema";

const TRUSTED_PROXIES = ["127.0.0.1", "::1", "172.17.0.1"];

const toAgentModelId = (model: string) => {
  const modelInfo = MODELS.find((m) => m.id === model);

  if (!modelInfo) {
    throw new Error(`Model ${model} not found.`);
  }

  return `${modelInfo.provider}/${modelInfo.id}`;
};

interface GatewayConfigInput {
  origin: string;
  token: string;
  hooksToken: string;
  skills?: SkillsConfig;
}


interface SkillEntry {
  enabled: boolean;
  credentials?: Record<string, string>;
}

type SkillsConfig = Record<string, SkillEntry>;

const DEFAULT_SKILLS: SkillsConfig = {
  canvas: { enabled: true },
  "coding-agent": { enabled: true },
  healthcheck: { enabled: true },
  "skill-creator": { enabled: true },
};

const getSkillsConfig = (dbSkills?: SkillsConfig): { entries: SkillsConfig } => {
  const merged = { ...DEFAULT_SKILLS };

  if (dbSkills) {
    for (const [name, entry] of Object.entries(dbSkills)) {
      merged[name] = { ...merged[name], ...entry };
    }
  }

  return { entries: merged };
};

export const getGatewayConfig = ({
  origin,
  token,
  hooksToken,
  skills,
  ...config
}: OpenclawConfig & GatewayConfigInput) => ({
  gateway: {
    mode: "local",
    bind: "lan",
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
  skills: getSkillsConfig(skills),
  hooks: {
    enabled: true,
    token: hooksToken,
  },
});
