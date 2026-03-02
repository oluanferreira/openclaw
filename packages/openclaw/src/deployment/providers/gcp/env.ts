import { defineEnv } from "envin";
import * as z from "zod";

import { envConfig } from "@workspace/shared/constants";

import type { Preset } from "envin/types";

export const preset = {
  id: "gcp",
  server: {
    GCP_CREDENTIALS: z.string().min(1).optional(),
    GCP_PROJECT_ID: z.string().min(1),
    GCP_ZONE: z.string().min(1).default("us-central1-a"),
    GCP_INSTANCE_TEMPLATE_NAME: z
      .string()
      .min(1)
      .default("openclaw-gateway-template"),
    GCP_OPENCLAW_STATE_DIR: z.string().min(1).default("/var/lib/openclaw"),
    GCP_INSTANCE_DOMAIN_SUFFIX: z.string().min(1).optional(),
  },
} as const satisfies Preset;

export const env = defineEnv({
  ...envConfig,
  ...preset,
});
