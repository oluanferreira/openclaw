import { defineEnv } from "envin";

import { preset as auth } from "@workspace/auth/env";
import { preset as billing } from "@workspace/billing/env";
import { preset as db } from "@workspace/db/env";
import { preset as openclaw } from "@workspace/openclaw/env";
import { envConfig } from "@workspace/shared/constants";

import type { Preset } from "envin/types";

export const preset = {
  id: "api",
  extends: [auth, db, openclaw, billing],
} as const satisfies Preset;

export const env = defineEnv({
  ...envConfig,
  ...preset,
});
