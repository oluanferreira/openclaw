import { withSentryConfig } from "@sentry/nextjs";
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

export default withSentryConfig(config, {
  // Suppresses source map uploading logs during build
  silent: true,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  webpack: { treeshake: { removeDebugLogging: true } },

  // Hides source maps from generated client bundles
  sourcemaps: { deleteSourcemapsAfterUpload: true },

  // Only enable Sentry webpack plugin when DSN and auth token are available
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
