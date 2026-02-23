import * as z from "zod";

import { Model } from "../ai";
import { communicationChannelConfigSchema } from "../communication";

export const deployInstanceSchema = z.object({
  model: z.enum(Model),
  communication: communicationChannelConfigSchema,
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
