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

export const InstanceStatus = {
  STOPPED: "stopped",
  RUNNING: "running",
  STARTING: "starting",
  STOPPING: "stopping",
  RESTARTING: "restarting",
  REMOVING: "removing",
  PAUSED: "paused",
  EXITED: "exited",
  DEAD: "dead",
} as const;

export type InstanceStatus =
  (typeof InstanceStatus)[keyof typeof InstanceStatus];
