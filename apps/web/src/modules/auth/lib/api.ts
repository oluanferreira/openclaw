import { mutationOptions } from "@tanstack/react-query";

import { authClient } from "~/lib/auth/client";

const KEY = "auth";

const queries = {} as const;

const mutations = {
  signIn: {
    social: mutationOptions({
      mutationKey: [KEY, "signIn", "social"],
      mutationFn: (params: Parameters<typeof authClient.signIn.social>[0]) =>
        authClient.signIn.social(params),
    }),
  },
  signOut: mutationOptions({
    mutationKey: [KEY, "signOut"],
    mutationFn: () => authClient.signOut(),
  }),
} as const;

export const auth = {
  queries,
  mutations,
} as const;
