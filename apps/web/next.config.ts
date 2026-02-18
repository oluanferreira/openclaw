import type { NextConfig } from "next";

import "./env.config";

const INTERNAL_PACKAGES = [
  "@workspace/api",
  "@workspace/auth",
  "@workspace/db",
  "@workspace/i18n",
  "@workspace/shared",
  "@workspace/ui",
  "@workspace/ui-web",
];

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: INTERNAL_PACKAGES,
  experimental: {
    optimizePackageImports: INTERNAL_PACKAGES,
  },
};

export default config;
