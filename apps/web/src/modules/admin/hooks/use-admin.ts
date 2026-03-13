"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { admin as adminApi } from "../lib/api";

export const useAdminUsers = () => {
  return useQuery(adminApi.queries.users);
};

export const useAdminInstances = () => {
  return useQuery(adminApi.queries.instances);
};

export const useAdminSubscriptions = () => {
  return useQuery(adminApi.queries.subscriptions);
};

export const useAdminSubscriptionStats = () => {
  return useQuery(adminApi.queries.subscriptionStats);
};

export const useAdminInvoices = (customerId: string) => {
  return useQuery(adminApi.queries.invoices(customerId));
};

export const useAdminGrowth = () => {
  return useQuery(adminApi.queries.growth);
};

export const useAdminServersStats = () => {
  return useQuery(adminApi.queries.serversStats);
};

export const useAdminServers = () => {
  return useQuery(adminApi.queries.servers);
};

export const useAdminManageInstance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...adminApi.mutations.manageInstance,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries(adminApi.queries.instances);
      await queryClient.invalidateQueries(adminApi.queries.users);
      toast.success(`Instance ${variables.action} successful`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to manage instance");
    },
  });
};

export const useAdminDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...adminApi.mutations.deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries(adminApi.queries.users);
      await queryClient.invalidateQueries(adminApi.queries.instances);
      toast.success("User deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });
};

export const useAdminCreateServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...adminApi.mutations.createServer,
    onSuccess: async () => {
      await queryClient.invalidateQueries(adminApi.queries.servers);
      await queryClient.invalidateQueries(adminApi.queries.serversStats);
      toast.success("Servidor criado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar servidor");
    },
  });
};

export const useAdminUpdateServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...adminApi.mutations.updateServer,
    onSuccess: async () => {
      await queryClient.invalidateQueries(adminApi.queries.servers);
      await queryClient.invalidateQueries(adminApi.queries.serversStats);
      toast.success("Servidor atualizado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar servidor");
    },
  });
};

export const useAdminUptime = () => {
  return useQuery(adminApi.queries.uptime);
};

export const useAdminDeleteServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...adminApi.mutations.deleteServer,
    onSuccess: async () => {
      await queryClient.invalidateQueries(adminApi.queries.servers);
      await queryClient.invalidateQueries(adminApi.queries.serversStats);
      toast.success("Servidor removido com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover servidor");
    },
  });
};

export const useAdminModels = () => {
  return useQuery(adminApi.queries.models);
};

export const useAdminCreateModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...adminApi.mutations.createModel,
    onSuccess: async () => {
      await queryClient.invalidateQueries(adminApi.queries.models);
      toast.success("Modelo criado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar modelo");
    },
  });
};

export const useAdminUpdateModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...adminApi.mutations.updateModel,
    onSuccess: async () => {
      await queryClient.invalidateQueries(adminApi.queries.models);
      toast.success("Modelo atualizado com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar modelo");
    },
  });
};

export const useAdminDeleteModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...adminApi.mutations.deleteModel,
    onSuccess: async () => {
      await queryClient.invalidateQueries(adminApi.queries.models);
      toast.success("Modelo removido com sucesso");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover modelo");
    },
  });
};

export const useAdminReorderModels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...adminApi.mutations.reorderModels,
    onSuccess: async () => {
      await queryClient.invalidateQueries(adminApi.queries.models);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao reordenar modelos");
    },
  });
};

// ─── Referrals ──────────────────────────────────────────────

export const useAdminReferrals = () => {
  return useQuery(adminApi.queries.referrals);
};

export const useAdminReferralStats = () => {
  return useQuery(adminApi.queries.referralStats);
};

export const useAdminReferralCommissions = (affiliateId: string) => {
  return useQuery(adminApi.queries.referralCommissions(affiliateId));
};

export const useAdminUpdateReferralStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...adminApi.mutations.updateReferralStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries(adminApi.queries.referrals);
      await queryClient.invalidateQueries(adminApi.queries.referralStats);
      toast.success("Status do afiliado atualizado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });
};

// ─── Bridge ─────────────────────────────────────────────────

export const useAdminBridge = () => {
  return useQuery(adminApi.queries.bridge);
};

export const useAdminBridgeStats = () => {
  return useQuery(adminApi.queries.bridgeStats);
};

export const useAdminBridgeAudit = (instanceId: string) => {
  return useQuery(adminApi.queries.bridgeAudit(instanceId));
};

export const useAdminDisconnectBridge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    ...adminApi.mutations.disconnectBridge,
    onSuccess: async () => {
      await queryClient.invalidateQueries(adminApi.queries.bridge);
      await queryClient.invalidateQueries(adminApi.queries.bridgeStats);
      toast.success("Bridge desconectado");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao desconectar bridge");
    },
  });
};
