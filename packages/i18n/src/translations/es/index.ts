export const es = {
  common: async () => {
    await import("dayjs/locale/es");
    return import("./common.json");
  },
  auth: () => import("./auth.json"),
  marketing: () => import("./marketing.json"),
  dashboard: () => import("./dashboard.json"),
  validation: () => import("./validation.json"),
} as const;
