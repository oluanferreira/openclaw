/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { mutationOptions, queryOptions } from "@tanstack/react-query";

import { api } from "~/lib/api/client";

interface BridgeStatus {
  connected: boolean;
  lastSeen: string | null;
  deviceName: string | null;
  appVersion: string | null;
  capabilities: Record<string, boolean>;
  token: string;
}

interface BridgeTerminalConfig {
  allowlist: string[];
  workingDir: string | null;
  timeoutSeconds: number;
}

interface BridgeFileAllowedDir {
  path: string;
  permission: "read" | "read-write";
}

interface BridgeFileConfig {
  allowedDirs: BridgeFileAllowedDir[];
  blockedPatterns: string[];
}

interface BridgeNotificationConfig {
  allowedTypes: ("info" | "alert" | "action")[];
  soundEnabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}

interface BridgeMobileStatus {
  connected: boolean;
  lastSeen: string | null;
  deviceName: string | null;
}

const KEY = "bridge";

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
const bridgeApi = api.bridge as any;

const queries = {
  status: queryOptions<BridgeStatus>({
    queryKey: [KEY, "status"],
    queryFn: async () => {
      const res = await bridgeApi.status.$get();
      if (!res.ok) throw new Error("Failed to fetch bridge status");
      return res.json();
    },
    refetchInterval: 30_000,
  }),
  terminal: queryOptions<BridgeTerminalConfig>({
    queryKey: [KEY, "terminal"],
    queryFn: async () => {
      const res = await bridgeApi.terminal.$get();
      if (!res.ok) throw new Error("Failed to fetch terminal config");
      return res.json();
    },
  }),
  files: queryOptions<BridgeFileConfig>({
    queryKey: [KEY, "files"],
    queryFn: async () => {
      const res = await bridgeApi.files.$get();
      if (!res.ok) throw new Error("Failed to fetch file config");
      return res.json();
    },
  }),
  notifications: queryOptions<BridgeNotificationConfig>({
    queryKey: [KEY, "notifications"],
    queryFn: async () => {
      const res = await bridgeApi.notifications.$get();
      if (!res.ok) throw new Error("Failed to fetch notification config");
      return res.json();
    },
  }),
  mobileStatus: queryOptions<BridgeMobileStatus>({
    queryKey: [KEY, "mobileStatus"],
    queryFn: async () => {
      const res = await bridgeApi["mobile-status"].$get();
      if (!res.ok) throw new Error("Failed to fetch mobile status");
      return res.json();
    },
    refetchInterval: 30_000,
  }),
};

const mutations = {
  updateTerminal: mutationOptions({
    mutationKey: [KEY, "updateTerminal"],
    mutationFn: async (json: Partial<BridgeTerminalConfig>) => {
      const res = await bridgeApi.terminal.$put({ json });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Update failed");
      }
      return data as BridgeTerminalConfig;
    },
  }),
  updateNotifications: mutationOptions({
    mutationKey: [KEY, "updateNotifications"],
    mutationFn: async (json: Partial<BridgeNotificationConfig>) => {
      const res = await bridgeApi.notifications.$put({ json });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Update failed");
      }
      return data as BridgeNotificationConfig;
    },
  }),
  updateFiles: mutationOptions({
    mutationKey: [KEY, "updateFiles"],
    mutationFn: async (json: Partial<BridgeFileConfig>) => {
      const res = await bridgeApi.files.$put({ json });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Update failed");
      }
      return data as BridgeFileConfig;
    },
  }),
  rotateToken: mutationOptions({
    mutationKey: [KEY, "rotateToken"],
    mutationFn: async () => {
      const res = await bridgeApi.token.rotate.$post();
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Rotate failed");
      }
      return data as { token: string };
    },
  }),
  updateCapabilities: mutationOptions({
    mutationKey: [KEY, "updateCapabilities"],
    mutationFn: async (json: Record<string, boolean>) => {
      const res = await bridgeApi.capabilities.$put({ json });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Update failed");
      }
      return data as { capabilities: Record<string, boolean> };
    },
  }),
};

export const bridge = {
  queries,
  mutations,
} as const;
