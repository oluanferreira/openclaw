import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";

import { isInstanceReadyForPairing } from "~/modules/dashboard/instance/lib/status";

import { instance as instanceApi } from "../lib/api";
import { useInstance } from "./use-instance";

const useGatewayReady = () => {
  const { instance, status } = useInstance();

  const ready = useQuery({
    ...instanceApi.queries.ready,
    enabled:
      !!instance.data?.id && isInstanceReadyForPairing(status.data?.status),
  });

  return ready.data === true;
};

const useDevices = (ready: boolean) => {
  const { t } = useTranslation("dashboard");
  const { instance, status } = useInstance();
  const queryClient = useQueryClient();

  const query = useQuery({
    ...instanceApi.queries.pairing.devices,
    enabled:
      !!instance.data?.id &&
      isInstanceReadyForPairing(status.data?.status) &&
      ready,
  });

  const approve = useMutation({
    ...instanceApi.mutations.pairing.devices.approve,
    onSuccess: async () => {
      await queryClient.invalidateQueries(instanceApi.queries.pairing.devices);
      toast.success(t("instance.pairing.device.approve.success"));
    },
  });

  const reject = useMutation({
    ...instanceApi.mutations.pairing.devices.reject,
    onSuccess: async () => {
      await queryClient.invalidateQueries(instanceApi.queries.pairing.devices);
      toast.success(t("instance.pairing.device.reject.success"));
    },
  });

  return { query, approve, reject };
};

const useChannels = (ready: boolean) => {
  const { t } = useTranslation("dashboard");
  const { instance, status } = useInstance();
  const queryClient = useQueryClient();

  const query = useQuery({
    ...instanceApi.queries.pairing.channels,
    enabled:
      !!instance.data?.id &&
      isInstanceReadyForPairing(status.data?.status) &&
      ready,
  });

  const approve = useMutation({
    ...instanceApi.mutations.pairing.channels.approve,
    onSuccess: async () => {
      await queryClient.invalidateQueries(instanceApi.queries.pairing.channels);
      toast.success(t("instance.pairing.channel.approve.success"));
    },
  });

  const reject = useMutation({
    ...instanceApi.mutations.pairing.channels.reject,
    onSuccess: async () => {
      await queryClient.invalidateQueries(instanceApi.queries.pairing.channels);
      toast.success(t("instance.pairing.channel.reject.success"));
    },
  });

  return { query, approve, reject };
};

export const usePairing = () => {
  const ready = useGatewayReady();
  const devices = useDevices(ready);
  const channels = useChannels(ready);

  return { devices, channels };
};
