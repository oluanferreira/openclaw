import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { handle } from "@workspace/api/utils";

import { api } from "~/lib/api/client";

const queries = {
  me: queryOptions({
    queryKey: ["referral", "me"],
    queryFn: () => handle(api.referral.me.$get as never)(),
  }),
  commissions: (limit = 50, offset = 0) =>
    queryOptions({
      queryKey: ["referral", "commissions", limit, offset],
      queryFn: () =>
        handle(api.referral.commissions.$get as never)({
          query: { limit: String(limit), offset: String(offset) },
        } as never),
    }),
  payouts: queryOptions({
    queryKey: ["referral", "payouts"],
    queryFn: () => handle(api.referral.payouts.$get as never)(),
  }),
  network: queryOptions({
    queryKey: ["referral", "network"],
    queryFn: () => handle(api.referral.network.$get as never)(),
  }),
};

const mutations = {
  activate: mutationOptions({
    mutationFn: (data: {
      walletAddress: string;
      acceptedTerms: true;
      parentReferralCode?: string;
    }) => handle(api.referral.activate.$post)({ json: data } as never),
  }),
  updateWallet: mutationOptions({
    mutationFn: (walletAddress: string) =>
      handle(api.referral.wallet.$put)({ json: { walletAddress } } as never),
  }),
  acceptTerms: mutationOptions({
    mutationFn: () => handle(api.referral["accept-terms"].$put)({} as never),
  }),
};

export const referralApi = { queries, mutations } as const;
