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
