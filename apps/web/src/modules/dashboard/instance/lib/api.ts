import { mutationOptions } from "@tanstack/react-query";

import { handle } from "@workspace/api/utils";

import { api } from "~/lib/api/client";

import type { InferRequestType } from "hono/client";

const KEY = "instance";

const queries = {};

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
};

export const instance = {
  queries,
  mutations,
} as const;
