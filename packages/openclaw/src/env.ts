import { defineEnv } from "envin";

import { envConfig } from "@workspace/shared/constants";

import { preset as aiPreset } from "./config/ai/env";
import { preset as providerPreset } from "./deployment/providers/env";

import type { Preset } from "envin/types";

export const preset = {
  id: "openclaw",
  extends: [providerPreset, aiPreset],
} as const satisfies Preset;

export const env = defineEnv({
  ...envConfig,
  ...preset,
});
