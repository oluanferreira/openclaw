const ADMIN_PREFIX = "/admin";
const DASHBOARD_PREFIX = "/dashboard";

const API_PREFIX = "/api";

const pathsConfig = {
  index: "/",
  dashboard: {
    index: DASHBOARD_PREFIX,
    billing: `${DASHBOARD_PREFIX}/billing`,
  },
  admin: {
    index: ADMIN_PREFIX,
    users: `${ADMIN_PREFIX}/users`,
    instances: `${ADMIN_PREFIX}/instances`,
    subscriptions: `${ADMIN_PREFIX}/subscriptions`,
  },
} as const;

export { pathsConfig, DASHBOARD_PREFIX, ADMIN_PREFIX, API_PREFIX };
