const DASHBOARD_PREFIX = "/dashboard";

const API_PREFIX = "/api";

const pathsConfig = {
  index: "/",
  dashboard: {
    index: DASHBOARD_PREFIX,
    agents: {
      index: `${DASHBOARD_PREFIX}/agents`,
      agent: (agent: string) => `${DASHBOARD_PREFIX}/agents/${agent}`,
    },
    settings: {
      account: `${DASHBOARD_PREFIX}/settings/account`,
      billing: `${DASHBOARD_PREFIX}/settings/billing`,
      apiKeys: `${DASHBOARD_PREFIX}/settings/api-keys`,
    },
  },
} as const;

export { pathsConfig, DASHBOARD_PREFIX, API_PREFIX };
