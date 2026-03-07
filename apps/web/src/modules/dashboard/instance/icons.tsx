import { CommunicatonChannel, Provider } from "@workspace/openclaw/config";
import { Icons } from "@workspace/ui-web/icons";

export const CommunicationChannelIcon = {
  [CommunicatonChannel.TELEGRAM]: Icons.Telegram,
  [CommunicatonChannel.DISCORD]: Icons.Discord,
  [CommunicatonChannel.WHATSAPP]: Icons.Whatsapp,
} as const;

export const ProviderIcon = {
  [Provider.ANTHROPIC]: Icons.Claude,
  [Provider.OPENAI]: Icons.OpenAI,
  [Provider.GOOGLE]: Icons.Gemini,
} as const;
