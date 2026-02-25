import { Model, CommunicatonChannel } from "@workspace/openclaw/config";
import { Icons } from "@workspace/ui-web/icons";

export const CommunicationChannelIcon = {
  [CommunicatonChannel.TELEGRAM]: Icons.Telegram,
  [CommunicatonChannel.DISCORD]: Icons.Discord,
  [CommunicatonChannel.WHATSAPP]: Icons.Whatsapp,
} as const;

export const ModelIcon = {
  [Model.CLAUDE_OPUS_4_6]: Icons.Claude,
  [Model.GPT_5_2]: Icons.OpenAI,
  [Model.GEMINI_3_0_FLASH]: Icons.Gemini,
} as const;
