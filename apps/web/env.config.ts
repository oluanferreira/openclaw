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
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {},

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_PRODUCT_NAME: z.string(),
    NEXT_PUBLIC_URL: z.url(),
    NEXT_PUBLIC_DEFAULT_LOCALE: z.string().optional().default("en"),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  env: {
    ...process.env,
    NEXT_PUBLIC_PRODUCT_NAME: process.env.NEXT_PUBLIC_PRODUCT_NAME,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
  },
});
