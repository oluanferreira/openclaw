import { defineEnv } from "envin";
import * as z from "zod";

import { envConfig } from "@workspace/shared/constants";

import { preset as caddyPreset } from "./caddy/env";

import type { Preset } from "envin/types";

export const preset = {
  id: "vps",
  server: {
    VPS_HOST: z.string().min(1),
    VPS_SSH_PORT: z.coerce.number().int().positive().default(22),
    VPS_USER: z.string().min(1).default("root"),
    VPS_PRIVATE_KEY: z.string().min(1),
    VPS_PRIVATE_KEY_PASSPHRASE: z.string().min(1).optional(),
    VPS_DEPLOY_ROOT: z.string().min(1).default("/opt/openclaw"),
    VPS_OPENCLAW_IMAGE: z
      .string()
      .min(1)
      .default("ghcr.io/openclaw/openclaw:2026.2.24"),
    VPS_CONTAINER_MEMORY: z.string().min(1).default("2g"),
    VPS_CONTAINER_CPUS: z.string().min(1).default("1.5"),
    VPS_NODE_MAX_OLD_SPACE_SIZE: z.coerce
      .number()
      .int()
      .positive()
      .default(2048),
    VPS_GOGCLI_VERSION: z.string().min(1).default("0.11.0"),
    VPS_GH_CLI_VERSION: z.string().min(1).default("2.67.0"),
  },
  extends: [caddyPreset],
} as const satisfies Preset;

export const env = defineEnv({
  ...envConfig,
  ...preset,
});
