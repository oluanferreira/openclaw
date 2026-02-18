import { defineEnv } from "envin";

import { preset as auth } from "@workspace/auth/env";
import { preset as db } from "@workspace/db/env";
import { envConfig } from "@workspace/shared/constants";

import type { Preset } from "envin/types";

export const preset = {
  id: "api",
  extends: [auth, db],
} as const satisfies Preset;

export const env = defineEnv({
  ...envConfig,
  ...preset,
});
