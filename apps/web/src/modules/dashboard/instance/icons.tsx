import { CommunicatonChannel } from "@workspace/openclaw/config";
import { Icons } from "@workspace/ui-web/icons";

export const CommunicationChannelIcon = {
  [CommunicatonChannel.TELEGRAM]: Icons.Telegram,
  [CommunicatonChannel.DISCORD]: Icons.Discord,
  [CommunicatonChannel.WHATSAPP]: Icons.Whatsapp,
} as const;

const PROVIDER_ICONS: Record<string, typeof Icons.Bot> = {
  anthropic: Icons.Claude,
  openai: Icons.OpenAI,
  google: Icons.Gemini,
};

export function getModelIcon(provider: string) {
  return PROVIDER_ICONS[provider] ?? Icons.Bot;
}
