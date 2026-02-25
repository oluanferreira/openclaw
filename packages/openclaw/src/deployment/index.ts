import { strategy } from "./providers";

import type { ExecuteInstanceCommand, ManageInstanceAction } from "./schema";

export const { deploy, getStatus, cli, getLogs, getUrl } = strategy;

const COMMANDS: Record<ExecuteInstanceCommand, string> = {
  "devices:list": "devices list",
};

export const executeCommand = (id: string, command: ExecuteInstanceCommand) =>
  strategy.cli(id, COMMANDS[command]);

export const manage = async (id: string, action: ManageInstanceAction) => {
  return strategy[action](id);
};
