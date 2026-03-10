"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";

import { instance as instanceApi } from "../lib/api";

export const useApiKeys = () => {
  const { t } = useTranslation("dashboard");
  const queryClient = useQueryClient();

  const keys = useQuery(instanceApi.queries.keys);

  const updateKeys = useMutation({
    ...instanceApi.mutations.updateKeys,
    onSuccess: async () => {
      await queryClient.invalidateQueries(instanceApi.queries.keys);
      toast.success(t("instance.apiKeys.success"));
    },
    onError: () => {
      toast.error(t("instance.apiKeys.error"));
    },
  });

  return { keys, updateKeys };
};
