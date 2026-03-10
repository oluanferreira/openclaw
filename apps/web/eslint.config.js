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
  {
    files: ["src/modules/admin/**/*.{ts,tsx}", "src/app/**/admin/**/*.{ts,tsx}"],
    rules: {
      "i18next/no-literal-string": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["instrumentation.ts"],
    rules: {
      "no-restricted-properties": "off",
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];
