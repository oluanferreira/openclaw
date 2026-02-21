import * as z from "zod";

export const CommunicatonChannel = {
  TELEGRAM: "telegram",
  DISCORD: "discord",
  WHATSAPP: "whatsapp",
} as const;

export type CommunicatonChannel =
  (typeof CommunicatonChannel)[keyof typeof CommunicatonChannel];

export const telegramSchema = z.object({
  channel: z.literal(CommunicatonChannel.TELEGRAM),
  token: z.string().min(1),
});

export const communicationChannelConfigSchema = z.discriminatedUnion(
  "channel",
  [telegramSchema],
);
export type CommunicationChannelConfig = z.infer<
  typeof communicationChannelConfigSchema
>;
