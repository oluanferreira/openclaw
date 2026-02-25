import z from "zod";

import { CommunicatonChannel } from "../communication";

export const PairingRequestType = {
  CHANNEL: "channel",
  DEVICE: "device",
} as const;

export type PairingRequestType =
  (typeof PairingRequestType)[keyof typeof PairingRequestType];

export const channelRequestSchema = z.object({
  type: z.literal(PairingRequestType.CHANNEL),
  id: z.string(),
  channel: z.enum(CommunicatonChannel),
  code: z.string().min(8).max(8),
  createdAt: z.coerce.date(),
  meta: z.record(z.string(), z.unknown()),
});

export type ChannelRequest = z.infer<typeof channelRequestSchema>;

export const deviceRequestSchema = z.object({
  type: z.literal(PairingRequestType.DEVICE),
  id: z.string(),
  device: z.string(),
  platform: z.string(),
  clientId: z.string(),
  clientMode: z.string(),
  createdAt: z.coerce.date(),
});

export type DeviceRequest = z.infer<typeof deviceRequestSchema>;

export const pairingRequestSchema = z.discriminatedUnion("type", [
  channelRequestSchema,
  deviceRequestSchema,
]);

export type PairingRequest = z.infer<typeof pairingRequestSchema>;

export const cliChannelPairingListSchema = z.object({
  channel: z.enum(CommunicatonChannel),
  requests: z.array(
    z.object({
      id: z.string(),
      code: z.string().min(8).max(8),
      createdAt: z.coerce.date(),
      lastSeenAt: z.coerce.date(),
      meta: z.record(z.string(), z.unknown()),
    }),
  ),
});

export type CliChannelPairingList = z.infer<typeof cliChannelPairingListSchema>;

export const cliDevicePairingListSchema = z.object({
  pending: z.array(
    z.object({
      requestId: z.string(),
      deviceId: z.string(),
      publicKey: z.string(),
      platform: z.string(),
      clientId: z.string(),
      clientMode: z.string(),
      role: z.string(),
      roles: z.array(z.string()),
      scopes: z.array(z.string()),
      silent: z.boolean(),
      isRepair: z.boolean(),
      ts: z.coerce.number(),
    }),
  ),
});
export type CliDevicePairingList = z.infer<typeof cliDevicePairingListSchema>;
