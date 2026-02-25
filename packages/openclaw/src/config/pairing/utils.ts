import { PairingRequestType } from "./schema";

import type {
  ChannelRequest,
  CliChannelPairingList,
  CliDevicePairingList,
  DeviceRequest,
} from "./schema";

export const toDeviceRequests = (
  request: CliDevicePairingList,
): DeviceRequest[] =>
  request.pending.map((pending) => ({
    type: PairingRequestType.DEVICE,
    id: pending.requestId,
    device: pending.deviceId,
    platform: pending.platform,
    clientId: pending.clientId,
    clientMode: pending.clientMode,
    createdAt: new Date(pending.ts),
  }));

export const toChannelRequests = (
  request: CliChannelPairingList,
): ChannelRequest[] =>
  request.requests.map((r) => ({
    type: PairingRequestType.CHANNEL,
    id: r.id,
    channel: request.channel,
    code: r.code,
    createdAt: r.createdAt,
    meta: r.meta,
  }));
