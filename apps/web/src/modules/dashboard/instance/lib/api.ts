import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { handle } from "@workspace/api/utils";

import { api } from "~/lib/api/client";

import type { InferRequestType } from "hono/client";

const KEY = "instance";

const queries = {
  get: queryOptions({
    queryKey: [KEY, "get"],
    queryFn: () => handle(api.openclaw.$get)(),
  }),
  status: queryOptions({
    queryKey: [KEY, "status"],
    queryFn: () => handle(api.openclaw.status.$get)(),
  }),
  logs: queryOptions({
    queryKey: [KEY, "logs"],
    queryFn: () => handle(api.openclaw.logs.$get)(),
    refetchInterval: 1000,
  }),
};

const mutations = {
  deploy: mutationOptions({
    mutationKey: [KEY, "deploy"],
    mutationFn: (
      json: InferRequestType<(typeof api.openclaw)["$post"]>["json"],
    ) =>
      handle(api.openclaw.$post)({
        json,
      }),
  }),
  manage: mutationOptions({
    mutationKey: [KEY, "manage"],
    mutationFn: (
      json: InferRequestType<(typeof api.openclaw.manage)["$post"]>["json"],
    ) =>
      handle(api.openclaw.manage.$post)({
        json,
      }),
  }),
};

export const instance = {
  queries,
  mutations,
} as const;
