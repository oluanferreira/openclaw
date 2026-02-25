import { mutationOptions, queryOptions } from "@tanstack/react-query";
import * as z from "zod";

import { handle } from "@workspace/api/utils";
import { pairingRequestSchema } from "@workspace/openclaw/config";

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
  pairing: queryOptions({
    queryKey: [KEY, "pairing"],
    queryFn: () =>
      handle(api.openclaw.pairing.$get, {
        schema: z.array(pairingRequestSchema),
      })(),
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
  cli: mutationOptions({
    mutationKey: [KEY, "cli"],
    mutationFn: (
      json: InferRequestType<(typeof api.openclaw.cli)["$post"]>["json"],
    ) =>
      handle(api.openclaw.cli.$post)({
        json,
      }),
  }),
};

export const instance = {
  queries,
  mutations,
} as const;
