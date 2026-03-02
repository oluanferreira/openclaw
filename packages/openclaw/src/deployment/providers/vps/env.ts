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
    VPS_OPENCLAW_STATE_DIR: z.string().min(1).default("/var/lib/openclaw"),
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
      .default(1024),
  },
  extends: [caddyPreset],
} as const satisfies Preset;

export const env = defineEnv({
  ...envConfig,
  ...preset,
});
