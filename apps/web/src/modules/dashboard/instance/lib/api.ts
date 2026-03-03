import { mutationOptions, queryOptions } from "@tanstack/react-query";
import * as z from "zod";

import { handle } from "@workspace/api/utils";
import {
  channelRequestSchema,
  deviceRequestSchema,
} from "@workspace/openclaw/config";

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
    refetchInterval: 1000,
  }),
  logs: queryOptions({
    queryKey: [KEY, "logs"],
    queryFn: () => handle(api.openclaw.logs.$get)(),
    refetchInterval: 1000,
  }),
  pairing: {
    devices: queryOptions({
      queryKey: [KEY, "pairing", "devices"],
      queryFn: () =>
        handle(api.openclaw.pairing.devices.$get, {
          schema: z.array(deviceRequestSchema),
        })(),
    }),
    channels: queryOptions({
      queryKey: [KEY, "pairing", "channels"],
      queryFn: () =>
        handle(api.openclaw.pairing.channels.$get, {
          schema: z.array(channelRequestSchema),
        })(),
    }),
  },
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
  pairing: {
    devices: {
      approve: mutationOptions({
        mutationKey: [KEY, "pairing", "devices", "approve"],
        mutationFn: ({ id }: { id: string }) =>
          handle(api.openclaw.pairing.devices[":id"].$post)({
            param: { id },
          }),
      }),
      reject: mutationOptions({
        mutationKey: [KEY, "pairing", "devices", "reject"],
        mutationFn: ({ id }: { id: string }) =>
          handle(api.openclaw.pairing.devices[":id"].$delete)({
            param: { id },
          }),
      }),
    },
    channels: {
      approve: mutationOptions({
        mutationKey: [KEY, "pairing", "channels", "approve"],
        mutationFn: ({
          channel,
          ...json
        }: InferRequestType<
          (typeof api.openclaw.pairing.channels)[":channel"]["$post"]
        >["json"] & { channel: string }) =>
          handle(api.openclaw.pairing.channels[":channel"].$post)({
            param: { channel },
            json,
          }),
      }),
      reject: mutationOptions({
        mutationKey: [KEY, "pairing", "channels", "reject"],
        mutationFn: ({
          channel,
          ...json
        }: InferRequestType<
          (typeof api.openclaw.pairing.channels)[":channel"]["$delete"]
        >["json"] & { channel: string }) =>
          handle(api.openclaw.pairing.channels[":channel"].$delete)({
            param: { channel },
            json,
          }),
      }),
    },
  },
};

export const instance = {
  queries,
  mutations,
} as const;
