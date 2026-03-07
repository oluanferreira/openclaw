import { defineEnv } from "envin";
import * as z from "zod";

import { preset as auth } from "@workspace/auth/env";
import { preset as db } from "@workspace/db/env";
import { preset as openclaw } from "@workspace/openclaw/env";
import { envConfig } from "@workspace/shared/constants";

import type { Preset } from "envin/types";

export const preset = {
  id: "api",
  extends: [auth, db, openclaw],
  server: {
    URL: z.string(),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_PRICE_ID: z.string().min(1),
    // 64-char hex string = 32 bytes = AES-256 key
    ENCRYPTION_KEY: z
      .string()
      .length(64, "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
      .regex(/^[0-9a-f]+$/i, "ENCRYPTION_KEY must be a hex string")
      .optional(),
    UPTIMEROBOT_API_KEY: z.string().optional(),
  },
} as const satisfies Preset;

export const env = defineEnv({
  ...envConfig,
  ...preset,
});
