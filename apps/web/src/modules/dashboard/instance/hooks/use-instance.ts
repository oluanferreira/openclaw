import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";

import { pathsConfig } from "~/config/paths";

import { instance as instanceApi } from "../lib/api";

export const useInstance = () => {
  const { t } = useTranslation("dashboard");
  const router = useRouter();

  const instance = useQuery(instanceApi.queries.get);
  const queryClient = useQueryClient();

  const deploy = useMutation({
    ...instanceApi.mutations.deploy,
    onSuccess: async () => {
      await queryClient.invalidateQueries(instanceApi.queries.get);
      toast.success(t("instance.deploy.success"));
      router.refresh();
      router.replace(pathsConfig.dashboard.index);
    },
  });

  return { instance, deploy };
};
