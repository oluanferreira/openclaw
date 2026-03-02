import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";

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
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries(instanceApi.queries.status),
        queryClient.invalidateQueries(instanceApi.queries.logs),
        queryClient.invalidateQueries(instanceApi.queries.get),
      ]);
      toast.success(t("instance.deploy.success"));
      router.refresh();
      router.replace(pathsConfig.dashboard.index);
    },
  });

  const manage = useMutation({
    ...instanceApi.mutations.manage,
    onSuccess: (_, variables) => {
      void Promise.all([
        queryClient.invalidateQueries(instanceApi.queries.status),
        queryClient.invalidateQueries(instanceApi.queries.logs),
        queryClient.invalidateQueries(instanceApi.queries.get),
      ]);
      toast.success(t(`instance.manage.${variables.action}.success`));
    },
  });

  return { instance, status, deploy, manage };
};
