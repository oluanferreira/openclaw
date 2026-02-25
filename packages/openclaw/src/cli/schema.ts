import z from "zod";

import { CommunicatonChannel } from "../config";

export const Command = {
  PAIRING_APPROVE: "pairing:approve",
  PAIRING_REJECT: "pairing:reject",
  DEVICE_APPROVE: "device:approve",
  DEVICE_REJECT: "device:reject",
} as const;

export type Command = (typeof Command)[keyof typeof Command];

export const commandSchema = z.discriminatedUnion("command", [
  z.object({
    command: z.literal(Command.PAIRING_APPROVE),
    args: z.object({
      channel: z.enum(CommunicatonChannel),
      code: z.string(),
    }),
  }),
  z.object({
    command: z.literal(Command.PAIRING_REJECT),
    args: z.object({
      channel: z.enum(CommunicatonChannel),
      code: z.string(),
    }),
  }),
  z.object({
    command: z.literal(Command.DEVICE_APPROVE),
    args: z.object({
      id: z.string(),
    }),
  }),
  z.object({
    command: z.literal(Command.DEVICE_REJECT),
    args: z.object({
      id: z.string(),
    }),
  }),
]);

export type CommandPayload = z.infer<typeof commandSchema>;
