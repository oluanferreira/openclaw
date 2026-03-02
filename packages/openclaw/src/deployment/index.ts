import { strategy } from "./providers";

import type { ManageInstanceAction } from "./schema";

export const { deploy, getStatus, cli, getLogs, getUrl, updateKeys } = strategy;

export const manage = async (id: string, action: ManageInstanceAction) => {
  return strategy[action](id);
};
