import * as z from "zod";

import { Model } from "../config/ai";
import { openclawConfigSchema } from "../config";

export const aiKeysSchema = z.object({
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  googleApiKey: z.string().optional(),
});

export type AiKeysInput = z.input<typeof aiKeysSchema>;

export const deployInstanceSchema = openclawConfigSchema
  .pick({
    model: true,
    communication: true,
  })
  .extend({ aiKeys: aiKeysSchema })
  .superRefine((data, ctx) => {
    const required: Record<string, keyof AiKeysInput> = {
      [Model.GPT_5_2]: "openaiApiKey",
      [Model.CLAUDE_OPUS_4_6]: "anthropicApiKey",
      [Model.GEMINI_3_0_FLASH]: "googleApiKey",
    };

    const requiredKey = required[data.model];
    if (requiredKey && !data.aiKeys[requiredKey]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["aiKeys", requiredKey],
        message: "Required",
      });
    }
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
