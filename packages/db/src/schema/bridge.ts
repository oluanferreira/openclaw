import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "../lib/zod";

import { instance } from "./openclaw";

import type * as z from "zod";

export interface BridgeCapabilities {
  browser: boolean;
  terminal: boolean;
  files: boolean;
  clipboard: boolean;
  notifications: boolean;
}

export interface BridgeFileAllowedDir {
  path: string;
  permission: "read" | "read-write";
}

export interface BridgeFileConfig {
  allowedDirs: BridgeFileAllowedDir[];
  blockedPatterns: string[];
}

export interface BridgeTerminalConfig {
  allowlist: string[];
  workingDir: string | null;
  timeoutSeconds: number;
}

export interface BridgeNotificationConfig {
  allowedTypes: ("info" | "alert" | "action")[];
  soundEnabled: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}

const defaultTerminalConfig: BridgeTerminalConfig = {
  allowlist: [
    "git *",
    "npm *",
    "pnpm *",
    "ls",
    "pwd",
    "cat",
    "echo",
    "node --version",
  ],
  workingDir: null,
  timeoutSeconds: 30,
};

const defaultFileConfig: BridgeFileConfig = {
  allowedDirs: [],
  blockedPatterns: [
    ".env*",
    "*.pem",
    "*.key",
    ".ssh/",
    "credentials*",
    "*.p12",
    "*.pfx",
  ],
};

const defaultNotificationConfig: BridgeNotificationConfig = {
  allowedTypes: ["info", "alert", "action"],
  soundEnabled: true,
  quietHoursStart: null,
  quietHoursEnd: null,
};

const defaultCapabilities: BridgeCapabilities = {
  browser: true,
  terminal: true,
  files: false,
  clipboard: false,
  notifications: true,
};

export const bridgeConnection = pgTable("bridge_connection", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  instanceId: text("instance_id")
    .notNull()
    .references(() => instance.id, { onDelete: "cascade" }),
  lastSeen: timestamp("last_seen"),
  deviceName: text("device_name"),
  appVersion: text("app_version"),
  capabilities: jsonb()
    .$type<BridgeCapabilities>()
    .default(defaultCapabilities)
    .notNull(),
  terminalConfig: jsonb("terminal_config")
    .$type<BridgeTerminalConfig>()
    .default(defaultTerminalConfig)
    .notNull(),
  fileConfig: jsonb("file_config")
    .$type<BridgeFileConfig>()
    .default(defaultFileConfig)
    .notNull(),
  notificationConfig: jsonb("notification_config")
    .$type<BridgeNotificationConfig>()
    .default(defaultNotificationConfig)
    .notNull(),
  deviceType: text("device_type").default("desktop").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBridgeConnectionSchema =
  createInsertSchema(bridgeConnection);
export const selectBridgeConnectionSchema =
  createSelectSchema(bridgeConnection);
export const updateBridgeConnectionSchema =
  createUpdateSchema(bridgeConnection);

export type SelectBridgeConnection = z.infer<
  typeof selectBridgeConnectionSchema
>;
export type InsertBridgeConnection = z.infer<
  typeof insertBridgeConnectionSchema
>;

// --- Audit Log ---

export const bridgeAuditLog = pgTable("bridge_audit_log", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  instanceId: text("instance_id"),
  action: text().notNull(),
  params: jsonb().$type<Record<string, unknown>>(),
  result: text().notNull(),
  durationMs: integer("duration_ms"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBridgeAuditLogSchema = createInsertSchema(bridgeAuditLog);
export type InsertBridgeAuditLog = z.infer<typeof insertBridgeAuditLogSchema>;

// --- Mobile Request Queue (CB-3.4) ---

export interface MobileRequestArgs {
  description?: string;
  query?: string;
  days?: number;
  [key: string]: unknown;
}

export const bridgeMobileRequest = pgTable("bridge_mobile_request", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  instanceId: text("instance_id").notNull(),
  tool: text().notNull(),
  args: jsonb().$type<MobileRequestArgs>().default({}),
  status: text().notNull().default("pending"),
  result: jsonb(),
  error: text(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const insertBridgeMobileRequestSchema =
  createInsertSchema(bridgeMobileRequest);
export type InsertBridgeMobileRequest = z.infer<
  typeof insertBridgeMobileRequestSchema
>;
export const selectBridgeMobileRequestSchema =
  createSelectSchema(bridgeMobileRequest);
export type SelectBridgeMobileRequest = z.infer<
  typeof selectBridgeMobileRequestSchema
>;
