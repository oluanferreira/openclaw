export const pt = {
  common: async () => {
    await import("dayjs/locale/pt-br");
    return import("./common.json");
  },
  auth: () => import("./auth.json"),
  marketing: () => import("./marketing.json"),
  dashboard: () => import("./dashboard.json"),
  validation: () => import("./validation.json"),
} as const;
