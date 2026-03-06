import * as z from "zod";

import { openclawConfigSchema } from "../config";

export const deployInstanceSchema = openclawConfigSchema.pick({
  model: true,
  communication: true,
});

export type DeployInstanceSchemaInput = z.input<typeof deployInstanceSchema>;

export const ManageInstanceAction = {
  START: "start",
  STOP: "stop",
  RESTART: "restart",
  DESTROY: "destroy",
} as const;

export type ManageInstanceAction =
  (typeof ManageInstanceAction)[keyof typeof ManageInstanceAction];

export const manageInstanceSchema = z.object({
  action: z.enum(ManageInstanceAction),
});

export type ManageInstanceSchemaInput = z.input<typeof manageInstanceSchema>;

export const ExecuteInstanceCommand = {
  DEVICES_LIST: "devices:list",
} as const;

export type ExecuteInstanceCommand =
  (typeof ExecuteInstanceCommand)[keyof typeof ExecuteInstanceCommand];

export const executeInstanceCommandSchema = z.object({
  command: z.enum(ExecuteInstanceCommand),
});

export type ExecuteInstanceCommandSchemaInput = z.input<
  typeof executeInstanceCommandSchema
>;

export const logEntrySchema = z.object({
  timestamp: z.string().nullable(),
  message: z.string(),
});

export type LogEntry = z.infer<typeof logEntrySchema>;

export const logsSchema = z.array(logEntrySchema);

export type Logs = z.infer<typeof logsSchema>;

export const logsPageParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type LogsPageParams = z.infer<typeof logsPageParamsSchema>;

export const logsPageResponseSchema = z.object({
  entries: z.array(logEntrySchema),
  nextCursor: z.string().nullable(),
});

export type LogsPageResponse = z.infer<typeof logsPageResponseSchema>;
