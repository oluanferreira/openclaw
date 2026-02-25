import { Command } from "./schema";

import type { CommandPayload } from "./schema";

export const getCommandToRun = ({ command, args }: CommandPayload) => {
  switch (command) {
    case Command.PAIRING_APPROVE:
      return ["pairing", "approve", args.channel, args.code];
    case Command.PAIRING_REJECT:
      return ["pairing", "reject", args.channel, args.code];
    case Command.DEVICE_APPROVE:
      return ["devices", "approve", args.id];
    case Command.DEVICE_REJECT:
      return ["devices", "reject", args.id];
  }
};

export * from "./schema";
