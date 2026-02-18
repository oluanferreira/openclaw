const ADMIN_PREFIX = "/admin";
const DASHBOARD_PREFIX = "/dashboard";

const API_PREFIX = "/api";

const pathsConfig = {
  index: "/",
  dashboard: {
    user: {
      index: DASHBOARD_PREFIX,
    },
  },
} as const;

export { pathsConfig, DASHBOARD_PREFIX, ADMIN_PREFIX, API_PREFIX };
