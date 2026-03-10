import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { handle } from "@workspace/api/utils";

import { api } from "~/lib/api/client";

const KEY = "admin-support";

const queries = {
  list: queryOptions({
    queryKey: [KEY, "list"],
    queryFn: () => handle(api.support.admin.all.$get)(),
  }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [KEY, "detail", id],
      queryFn: () => handle(api.support.admin[":id"].$get)({ param: { id } }),
    }),
};

const mutations = {
  reply: (id: string) =>
    mutationOptions({
      mutationKey: [KEY, "reply", id],
      mutationFn: (json: { message: string }) =>
        handle(api.support.admin[":id"].reply.$post)({ param: { id }, json }),
    }),
  changeStatus: (id: string) =>
    mutationOptions({
      mutationKey: [KEY, "status", id],
      mutationFn: (json: { status: "open" | "in_progress" | "closed" }) =>
        handle(api.support.admin[":id"].status.$put)({ param: { id }, json }),
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
        const res = await fetch(`/api/support/admin/${ticketId}/attachments`, {
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

export const adminSupport = {
  queries,
  mutations,
} as const;
