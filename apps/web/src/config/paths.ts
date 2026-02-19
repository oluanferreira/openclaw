const ADMIN_PREFIX = "/admin";
const DASHBOARD_PREFIX = "/dashboard";

const API_PREFIX = "/api";

const pathsConfig = {
  index: "/",
  dashboard: {
    user: {
      index: DASHBOARD_PREFIX,
      assistants: {
        assistant: (id: string) => `${DASHBOARD_PREFIX}/assistants/${id}`,
      },
      account: `${DASHBOARD_PREFIX}/account`,
      subscription: `${DASHBOARD_PREFIX}/subscription`,
      apiKeys: `${DASHBOARD_PREFIX}/api-keys`,
    },
  },
} as const;

export { pathsConfig, DASHBOARD_PREFIX, ADMIN_PREFIX, API_PREFIX };
