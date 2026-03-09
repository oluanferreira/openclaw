const ADMIN_PREFIX = "/admin";
const DASHBOARD_PREFIX = "/dashboard";

const API_PREFIX = "/api";

const pathsConfig = {
  index: "/",
  login: "/login",
  dashboard: {
    index: DASHBOARD_PREFIX,
    account: `${DASHBOARD_PREFIX}/account`,
    support: `${DASHBOARD_PREFIX}/support`,
    billing: `${DASHBOARD_PREFIX}/billing`,
    apiKeys: `${DASHBOARD_PREFIX}/api-keys`,
    skills: `${DASHBOARD_PREFIX}/skills`,
    referral: `${DASHBOARD_PREFIX}/referral`,
  },
  admin: {
    index: ADMIN_PREFIX,
    tickets: `${ADMIN_PREFIX}/tickets`,
    users: `${ADMIN_PREFIX}/users`,
    instances: `${ADMIN_PREFIX}/instances`,
    subscriptions: `${ADMIN_PREFIX}/subscriptions`,
    models: `${ADMIN_PREFIX}/models`,
    referrals: `${ADMIN_PREFIX}/referrals`,
  },
  legal: {
    terms: "/terms",
    privacy: "/privacy",
    referralTerms: "/referral-terms",
  },
} as const;

export { pathsConfig, DASHBOARD_PREFIX, ADMIN_PREFIX, API_PREFIX };
