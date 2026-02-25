import { CommunicatonChannel } from "./schema";

export const COMMUNICATION_CHANNELS = [
  {
    id: CommunicatonChannel.TELEGRAM,
    name: "Telegram",
    disabled: false,
  },
  {
    id: CommunicatonChannel.DISCORD,
    name: "Discord",
    disabled: true,
  },
  {
    id: CommunicatonChannel.WHATSAPP,
    name: "WhatsApp",
    disabled: true,
  },
] as const;
