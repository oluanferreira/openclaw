import { cli } from "../../deployment";

import {
  cliChannelPairingListSchema,
  cliDevicePairingListSchema,
} from "./schema";
import { toChannelRequests, toDeviceRequests } from "./utils";

const getDevicePairingList = async (id: string) => {
  try {
    const result = await cli(id, ["devices", "list", "--json"]);
    return cliDevicePairingListSchema.safeParse(JSON.parse(result.stdout));
  } catch {
    return null;
  }
};

const getChannelPairingList = async (id: string) => {
  try {
    const result = await cli(id, ["pairing", "list", "--json"]);
    return cliChannelPairingListSchema.safeParse(JSON.parse(result.stdout));
  } catch {
    return null;
  }
};

export const getPairingRequests = async (id: string) => {
  const [devices, channels] = await Promise.all([
    getDevicePairingList(id),
    getChannelPairingList(id),
  ]);

  return [
    ...(devices?.data ? toDeviceRequests(devices.data) : []),
    ...(channels?.data ? toChannelRequests(channels.data) : []),
  ];
};
