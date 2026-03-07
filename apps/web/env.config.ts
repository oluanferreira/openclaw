import { defineEnv } from "envin";
import { vercel } from "envin/presets/zod";
import * as z from "zod";

import { preset as api } from "@workspace/api/env";
import { preset as i18n } from "@workspace/i18n/env";
import { envConfig, NodeEnv } from "@workspace/shared/constants";

export default defineEnv({
  ...envConfig,
  extends: [vercel, api, i18n],
  shared: {
    NODE_ENV: z.enum(NodeEnv).default(NodeEnv.DEVELOPMENT),
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app is not built with invalid env vars.
   */
  server: {},

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with NEXT_PUBLIC_.
   */
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_PRODUCT_NAME: z.string(),
    NEXT_PUBLIC_URL: z.url(),
    NEXT_PUBLIC_DEFAULT_LOCALE: z.string().optional().default("en"),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional().default(""),
    NEXT_PUBLIC_PRICE_DISPLAY_USD: z.string().optional().default("$29.90"),
    NEXT_PUBLIC_PRICE_DISPLAY_BRL: z.string().optional().default("R$153,39"),
    NEXT_PUBLIC_NEXT_PRICE_DISPLAY_USD: z.string().optional().default("$39.90"),
    NEXT_PUBLIC_NEXT_PRICE_DISPLAY_BRL: z.string().optional().default("R$199,90"),
  },
  /**
   * Destructure all variables from process.env to make sure they are not tree-shaken away.
   */
  env: {
    ...process.env,
    NEXT_PUBLIC_PRODUCT_NAME: process.env.NEXT_PUBLIC_PRODUCT_NAME,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_PRICE_DISPLAY_USD: process.env.NEXT_PUBLIC_PRICE_DISPLAY_USD,
    NEXT_PUBLIC_PRICE_DISPLAY_BRL: process.env.NEXT_PUBLIC_PRICE_DISPLAY_BRL,
    NEXT_PUBLIC_NEXT_PRICE_DISPLAY_USD: process.env.NEXT_PUBLIC_NEXT_PRICE_DISPLAY_USD,
    NEXT_PUBLIC_NEXT_PRICE_DISPLAY_BRL: process.env.NEXT_PUBLIC_NEXT_PRICE_DISPLAY_BRL,
  },
});
