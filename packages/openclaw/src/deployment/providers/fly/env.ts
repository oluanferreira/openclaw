import { defineEnv } from "envin";
import * as z from "zod";

import { envConfig } from "@workspace/shared/constants";

import type { Preset } from "envin/types";

export const preset = {
  id: "fly",
  server: {
    FLY_API_TOKEN: z.string().min(1),
    FLY_ORG_SLUG: z.string().min(1),
    FLY_REGION: z.string().min(1).default("iad"),
    FLY_OPENCLAW_IMAGE: z
      .string()
      .min(1)
      .default("ghcr.io/openclaw/openclaw:2026.3.2"),
    FLY_MACHINE_CPUS: z.coerce.number().int().positive().default(2),
    FLY_MACHINE_MEMORY_MB: z.coerce.number().int().positive().default(2048),
    FLY_VOLUME_SIZE_GB: z.coerce.number().int().positive().default(1),
    FLY_OPENCLAW_STATE_DIR: z.string().min(1).default("/data"),
  },
} as const satisfies Preset;

export const env = defineEnv({
  ...envConfig,
  ...preset,
});
