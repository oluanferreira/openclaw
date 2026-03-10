import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { handle } from "@workspace/api/utils";

import { api } from "~/lib/api/client";

const queries = {
  subscription: queryOptions({
    queryKey: ["billing", "subscription"],
    queryFn: () => handle(api.billing.subscription.$get)(),
  }),
};

const mutations = {
  checkout: mutationOptions({
    mutationFn: (currency?: "usd" | "brl") =>
      handle(api.billing.checkout.$post)({
        json: { currency: currency ?? "usd" },
      }),
  }),
  portal: mutationOptions({
    mutationFn: () => handle(api.billing.portal.$post)({ json: {} }),
  }),
};

export const billingApi = {
  queries,
  mutations,
} as const;
