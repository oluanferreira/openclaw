import { strategy } from "./providers";

import type { ManageInstanceAction } from "./schema";

export const { deploy, getStatus, cli, getLogs, getUrl } = strategy;

export const manage = async (id: string, action: ManageInstanceAction) => {
  return strategy[action](id);
};
