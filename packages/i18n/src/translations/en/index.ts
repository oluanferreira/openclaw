export const en = {
  common: () => import("./common.json"),
  auth: () => import("./auth.json"),
  marketing: () => import("./marketing.json"),
  dashboard: () => import("./dashboard.json"),
  validation: () => import("./validation.json"),
  billing: () => import("./billing.json"),
} as const;
