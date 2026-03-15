import { cli } from "../../deployment";
import {
  cliChannelPairingListSchema,
  cliDevicePairingListSchema,
} from "./schema";
import { toChannelRequests, toDeviceRequests } from "./utils";

const getDevicePairingList = async (id: string) => {
  try {
    const result = await cli(id, ["devices", "list", "--json"]);
    const data = cliDevicePairingListSchema.safeParse(
      JSON.parse(result.stdout),
    ).data;

    return data ? toDeviceRequests(data) : null;
  } catch {
    return null;
  }
};

const getChannelPairingList = async (id: string) => {
  try {
    const result = await cli(id, ["pairing", "list", "--json"]);
    const data = cliChannelPairingListSchema.safeParse(
      JSON.parse(result.stdout),
    ).data;

    return data ? toChannelRequests(data) : null;
  } catch {
    return null;
  }
};

export { getDevicePairingList, getChannelPairingList };
