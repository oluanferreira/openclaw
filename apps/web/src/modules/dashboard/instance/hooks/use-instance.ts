import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";
import { ManageInstanceAction } from "@workspace/openclaw";

import { pathsConfig } from "~/config/paths";

import { instance as instanceApi } from "../lib/api";

export const useInstance = () => {
  const { t } = useTranslation("dashboard");
  const router = useRouter();
  const queryClient = useQueryClient();

  const instance = useQuery(instanceApi.queries.get);
  const status = useQuery({
    ...instanceApi.queries.status,
    enabled: !!instance.data?.id,
  });

  const deploy = useMutation({
    ...instanceApi.mutations.deploy,
    onSuccess: async () => {
      queryClient.removeQueries({
        queryKey: instanceApi.queries.logs.queryKey,
      });
      await Promise.all([
        queryClient.invalidateQueries(instanceApi.queries.get),
        queryClient.invalidateQueries(instanceApi.queries.status),
      ]);
      router.replace(pathsConfig.dashboard.index);
      toast.success(t("instance.deploy.success"));
    },
  });

  const manage = useMutation({
    ...instanceApi.mutations.manage,
    onSuccess: async (_, variables) => {
      const isDestroy = variables.action === ManageInstanceAction.DESTROY;

      if (isDestroy) {
        queryClient.removeQueries({
          queryKey: instanceApi.queries.logs.queryKey,
        });
        await queryClient.invalidateQueries(instanceApi.queries.get);
      }

      await Promise.all([
        queryClient.invalidateQueries(instanceApi.queries.status),
        queryClient.invalidateQueries(instanceApi.queries.logs),
      ]);

      toast.success(t(`instance.manage.${variables.action}.success`));
    },
  });

  return { instance, status, deploy, manage };
};
