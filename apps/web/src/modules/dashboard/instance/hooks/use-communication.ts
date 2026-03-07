import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@workspace/i18n";

import { instance as instanceApi } from "~/modules/dashboard/instance/lib/api";

export const useCommunication = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation("dashboard");

  const communication = useQuery(instanceApi.queries.communication);

  const updateCommunication = useMutation({
    ...instanceApi.mutations.updateCommunication,
    onSuccess: (data) => {
      void queryClient.invalidateQueries(instanceApi.queries.communication);
      void queryClient.invalidateQueries(instanceApi.queries.get);
      const botName = (data as { botName?: string })?.botName;
      toast.success(
        t("instance.settings.communication.success", { botName: botName ?? "Bot" }),
      );
    },
    onError: () => {
      toast.error(t("instance.settings.communication.error"));
    },
  });

  return { communication, updateCommunication };
};
