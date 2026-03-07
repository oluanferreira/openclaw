import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";
import { ApiError } from "@workspace/api/utils";
import { InstanceStatus } from "@workspace/openclaw";

import { pathsConfig } from "~/config/paths";

import { instance as instanceApi } from "../lib/api";

// Container leva ~2 minutos para inicializar. Se a instância foi criada há menos
// de 3 minutos e o status ainda não respondeu, considera como "inicializando".
const INIT_WINDOW_MS = 3 * 60 * 1000;

export const useInstance = () => {
  const { t } = useTranslation("dashboard");
  const router = useRouter();
  const queryClient = useQueryClient();

  const instance = useQuery(instanceApi.queries.get);
  const status = useQuery({
    ...instanceApi.queries.status,
    // Only poll when instance exists — avoids 401 spam when no instance is deployed
    enabled: !!instance.data,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.code === "error.unauthorized") &&
      failureCount < 3,
  });

  // Detecta fase de inicialização: instância existe, criada há < 3min, status ainda não veio
  const isInitializing =
    !!instance.data &&
    !status.data &&
    !status.isError &&
    Date.now() - new Date(instance.data.createdAt).getTime() < INIT_WINDOW_MS;

  // Status efetivo: durante inicialização mostra STARTING, senão usa o status real
  const effectiveStatus = isInitializing
    ? { status: InstanceStatus.STARTING }
    : status.data ?? null;

  const deploy = useMutation({
    ...instanceApi.mutations.deploy,
    onSuccess: async () => {
      await queryClient.invalidateQueries(instanceApi.queries.status);
      await queryClient.invalidateQueries(instanceApi.queries.logs);
      await queryClient.invalidateQueries(instanceApi.queries.get);
      toast.success(t("instance.deploy.success"));
      router.refresh();
      router.replace(pathsConfig.dashboard.index);
    },
  });

  const manage = useMutation({
    ...instanceApi.mutations.manage,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries(instanceApi.queries.status);
      await queryClient.invalidateQueries(instanceApi.queries.logs);
      await queryClient.invalidateQueries(instanceApi.queries.get);
      toast.success(t(`instance.manage.${variables.action}.success`));
    },
  });

  return { instance, status: { ...status, data: effectiveStatus }, isInitializing, deploy, manage };
};
