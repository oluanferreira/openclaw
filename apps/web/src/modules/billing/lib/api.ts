import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { Plan } from "@workspace/billing";

import { authClient } from "~/lib/auth/client";

const KEY = "billing";

const queries = {
  active: queryOptions({
    queryKey: [KEY, "subscription", "active"],
    queryFn: () => authClient.subscription.list(),
  }),
};

const mutations = {
  checkout: mutationOptions({
    mutationKey: [KEY, "subscription", "checkout"],
    mutationFn: ({
      successUrl,
      cancelUrl,
    }: {
      successUrl: string;
      cancelUrl: string;
    }) =>
      authClient.subscription.upgrade({
        plan: Plan.PRO,
        successUrl,
        cancelUrl,
      }),
  }),
  portal: mutationOptions({
    mutationKey: [KEY, "subscription", "portal"],
    mutationFn: ({ returnUrl }: { returnUrl: string }) =>
      authClient.subscription.billingPortal({
        returnUrl,
      }),
  }),
  restore: mutationOptions({
    mutationKey: [KEY, "subscription", "restore"],
    mutationFn: () => authClient.subscription.restore(),
  }),
};

export const billing = {
  queries,
  mutations,
} as const;
