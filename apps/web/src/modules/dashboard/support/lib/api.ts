import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { handle } from "@workspace/api/utils";

import { api } from "~/lib/api/client";

import type { InferRequestType } from "hono/client";

const KEY = "support";

const queries = {
  list: queryOptions({
    queryKey: [KEY, "list"],
    queryFn: () => handle(api.support.$get)(),
  }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [KEY, "detail", id],
      queryFn: () => handle(api.support[":id"].$get)({ param: { id } }),
    }),
};

const mutations = {
  create: mutationOptions({
    mutationKey: [KEY, "create"],
    mutationFn: (
      json: InferRequestType<(typeof api.support)["$post"]>["json"],
    ) => handle(api.support.$post)({ json }),
  }),
  reply: (id: string) =>
    mutationOptions({
      mutationKey: [KEY, "reply", id],
      mutationFn: (json: { message: string }) =>
        handle(api.support[":id"].reply.$post)({ param: { id }, json }),
    }),
  uploadAttachment: (ticketId: string) =>
    mutationOptions({
      mutationKey: [KEY, "uploadAttachment", ticketId],
      mutationFn: async ({
        file,
        replyId,
      }: {
        file: File;
        replyId?: string;
      }) => {
        const form = new FormData();
        form.append("file", file);
        if (replyId) form.append("replyId", replyId);
        const res = await fetch(`/api/support/${ticketId}/attachments`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        if (!res.ok) throw new Error("Upload failed");
        return res.json() as Promise<{
          id: string;
          ticketId: string;
          replyId: string | null;
          fileName: string;
          mimeType: string;
          fileSize: number;
          storedName: string;
          createdAt: string;
        }>;
      },
    }),
};

export const support = {
  queries,
  mutations,
} as const;
