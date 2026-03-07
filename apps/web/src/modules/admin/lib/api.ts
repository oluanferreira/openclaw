import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { handle } from "@workspace/api/utils";
import type { ManageInstanceAction } from "@workspace/openclaw";

import { api } from "~/lib/api/client";

const KEY = "admin";

const queries = {
  users: queryOptions({
    queryKey: [KEY, "users"],
    queryFn: () => handle(api.admin.users.$get)(),
  }),
  instances: queryOptions({
    queryKey: [KEY, "instances"],
    queryFn: () => handle(api.admin.instances.$get)(),
  }),
  subscriptions: queryOptions({
    queryKey: [KEY, "subscriptions"],
    queryFn: () => handle(api.admin.subscriptions.$get)(),
  }),
  subscriptionStats: queryOptions({
    queryKey: [KEY, "subscriptions", "stats"],
    queryFn: () => handle(api.admin.subscriptions.stats.$get)(),
  }),
  invoices: (customerId: string) =>
    queryOptions({
      queryKey: [KEY, "invoices", customerId],
      queryFn: () =>
        handle(api.admin.subscriptions[":customerId"].invoices.$get)({
          param: { customerId },
        }),
      enabled: !!customerId,
    }),
  growth: queryOptions({
    queryKey: [KEY, "stats", "growth"],
    queryFn: () => handle(api.admin.stats.growth.$get)(),
  }),
  serversStats: queryOptions({
    queryKey: [KEY, "stats", "servers"],
    queryFn: () => handle(api.admin.stats.servers.$get)(),
    refetchInterval: 30000,
  }),
  servers: queryOptions({
    queryKey: [KEY, "servers"],
    queryFn: () => handle(api.admin.servers.$get)(),
  }),
  uptime: queryOptions({
    queryKey: [KEY, "stats", "uptime"],
    queryFn: () => handle((api.admin.stats as any).uptime.$get)(),
    refetchInterval: 60_000,
  }),
};

const mutations = {
  manageInstance: mutationOptions({
    mutationKey: [KEY, "manage-instance"],
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: ManageInstanceAction;
    }) =>
      handle(api.admin.instances[":id"].manage.$post)({
        param: { id },
        json: { action },
      }),
  }),
  deleteUser: mutationOptions({
    mutationKey: [KEY, "delete-user"],
    mutationFn: (id: string) =>
      handle(api.admin.users[":id"].$delete)({
        param: { id },
      }),
  }),
  createServer: mutationOptions({
    mutationKey: [KEY, "create-server"],
    mutationFn: (data: {
      id: string;
      name: string;
      location: string;
      endpoint?: string;
      token?: string;
    }) =>
      handle(api.admin.servers.$post)({
        json: data,
      }),
  }),
  updateServer: mutationOptions({
    mutationKey: [KEY, "update-server"],
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      location?: string;
      endpoint?: string;
      token?: string;
      isActive?: boolean;
    }) =>
      handle(api.admin.servers[":id"].$put)({
        param: { id },
        json: data,
      }),
  }),
  deleteServer: mutationOptions({
    mutationKey: [KEY, "delete-server"],
    mutationFn: (id: string) =>
      handle(api.admin.servers[":id"].$delete)({
        param: { id },
      }),
  }),
};

export const admin = {
  queries,
  mutations,
} as const;
