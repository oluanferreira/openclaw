import { defineEnv } from "envin";
import * as z from "zod";

import { envConfig } from "@workspace/shared/constants";

import type { Preset } from "envin/types";

export const preset = {
  id: "caddy",
  server: {
    VPS_INSTANCE_DOMAIN_SUFFIX: z.string().min(1),
    VPS_CADDY_ROUTES_DIR: z.string().min(1).default("/etc/caddy/routes"),
    VPS_CADDY_CONFIG_PATH: z.string().min(1).default("/etc/caddy/Caddyfile"),
  },
} as const satisfies Preset;

export const env = defineEnv({
  ...envConfig,
  ...preset,
});
