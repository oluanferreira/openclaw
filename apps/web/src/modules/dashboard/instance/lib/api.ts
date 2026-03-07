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
    refetchInterval: 15_000,
  }),
  logs: queryOptions({
    queryKey: [KEY, "logs"],
    queryFn: () => handle(api.openclaw.logs.$get)(),
    refetchInterval: 5_000,
  }),
  pairing: queryOptions({
    queryKey: [KEY, "pairing"],
    queryFn: () =>
      handle(api.openclaw.pairing.$get, {
        schema: z.array(pairingRequestSchema),
      })(),
  }),
  keys: queryOptions({
    queryKey: [KEY, "keys"],
    queryFn: () => handle(api.openclaw.keys.$get)(),
  }),
  communication: queryOptions({
    queryKey: [KEY, "communication"],
    queryFn: async () => {
      const res = await api.openclaw.communication.$get();
      if (!res.ok) return { channel: "", maskedToken: "", botName: "" };
      return (await res.json()) as { channel: string; maskedToken: string; botName: string };
    },
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
  updateKeys: mutationOptions({
    mutationKey: [KEY, "updateKeys"],
    mutationFn: (
      json: InferRequestType<(typeof api.openclaw.keys)["$put"]>["json"],
    ) =>
      handle(api.openclaw.keys.$put)({
        json,
      }),
  }),
  updateCommunication: mutationOptions({
    mutationKey: [KEY, "updateCommunication"],
    mutationFn: async (json: { channel: "telegram"; token: string }) => {
      const res = await api.openclaw.communication.$put({ json });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Update failed");
      }
      return data as { success: boolean; botName: string };
    },
  }),
  updateModel: mutationOptions({
    mutationKey: [KEY, "updateModel"],
    mutationFn: async (json: { model: string }) => {
      const res = await api.openclaw.model.$put({ json });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Update failed");
      }
      return data as { success: boolean; model: string };
    },
  }),
};

export const instance = {
  queries,
  mutations,
} as const;
