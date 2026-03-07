import * as z from "zod";

export const CommunicatonChannel = {
  TELEGRAM: "telegram",
  DISCORD: "discord",
  WHATSAPP: "whatsapp",
} as const;

export type CommunicatonChannel =
  (typeof CommunicatonChannel)[keyof typeof CommunicatonChannel];

/**
 * Telegram bot token format: {bot_id}:{secret}
 * - bot_id: 8-10 digits
 * - secret: 35 alphanumeric chars (including _ and -)
 */
const TELEGRAM_TOKEN_REGEX = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;

export const telegramSchema = z.object({
  channel: z.literal(CommunicatonChannel.TELEGRAM),
  token: z.string().regex(TELEGRAM_TOKEN_REGEX, "Invalid Telegram bot token format"),
});

/**
 * Schema for updating communication config (token only, channel stays the same).
 */
export const updateCommunicationSchema = z.object({
  channel: z.literal(CommunicatonChannel.TELEGRAM),
  token: z.string().regex(TELEGRAM_TOKEN_REGEX, "Invalid Telegram bot token format"),
});

export const communicationChannelConfigSchema = z.discriminatedUnion(
  "channel",
  [telegramSchema],
);
export type CommunicationChannelConfig = z.infer<
  typeof communicationChannelConfigSchema
>;

/**
 * Masks a token for safe display: shows first 4 + "..." + last 4 chars.
 * Returns empty string for null/undefined/short values.
 */
export function maskToken(token: string | null | undefined): string {
  if (!token || token.length < 10) return "";
  return token.slice(0, 4) + "..." + token.slice(-4);
}
