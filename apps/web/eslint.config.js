import baseConfig from "@workspace/eslint-config/base";
import nextConfig from "@workspace/eslint-config/next";
import reactConfig from "@workspace/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextConfig,
];
