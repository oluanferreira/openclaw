import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { bridge } from "~/modules/dashboard/bridge/lib/api";

export const useBridgeStatus = () => {
  return useQuery(bridge.queries.status);
};

export const useBridgeTerminal = () => {
  return useQuery(bridge.queries.terminal);
};

export const useBridgeFiles = () => {
  return useQuery(bridge.queries.files);
};

export const useUpdateTerminal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...bridge.mutations.updateTerminal,
    onSuccess: () => {
      void queryClient.invalidateQueries(bridge.queries.terminal);
      toast.success("Terminal config updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateFiles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...bridge.mutations.updateFiles,
    onSuccess: () => {
      void queryClient.invalidateQueries(bridge.queries.files);
      toast.success("File config updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useRotateToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...bridge.mutations.rotateToken,
    onSuccess: () => {
      void queryClient.invalidateQueries(bridge.queries.status);
      toast.success("Token rotated — reconnect Bridge app");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateCapabilities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...bridge.mutations.updateCapabilities,
    onSuccess: () => {
      void queryClient.invalidateQueries(bridge.queries.status);
      toast.success("Capabilities updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
