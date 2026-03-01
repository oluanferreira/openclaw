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
  },
} as const satisfies Preset;

export const env = defineEnv({
  ...envConfig,
  ...preset,
});
