import { createFetch, createSchema } from "@better-fetch/fetch";
import * as z from "zod";

import { parseTextLogLine, stripAnsi } from "../../logs";

import { env } from "./env";

import type { LogEntry, LogsPageParams } from "../../schema";

const API_BASE_URL = "https://api.machines.dev/v1";
const LOGS_API_BASE_URL = "https://api.fly.io/api/v1";

const createAppRequestSchema = z.object({
  name: z.string().min(1),
  org_slug: z.string().min(1),
  enable_subdomains: z.boolean().optional(),
});

const createVolumeRequestSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  size_gb: z.number().int().positive(),
});

const machineGuestSchema = z.object({
  cpu_kind: z.enum(["shared", "performance"]),
  cpus: z.number().int().positive(),
  memory_mb: z.number().int().positive(),
});

const machineMountSchema = z.object({
  path: z.string().min(1),
  volume: z.string().min(1),
});

const machineFileSchema = z.object({
  guest_path: z.string().min(1),
  raw_value: z.string().min(1),
  mode: z.number().int().positive(),
});

const machineInitSchema = z.object({
  exec: z.array(z.string()).optional(),
  entrypoint: z.array(z.string()).optional(),
  cmd: z.array(z.string()).optional(),
});

const machineRestartSchema = z.object({
  policy: z.enum(["no", "always", "on-failure", "spot-price"]),
});

const machinePortSchema = z.object({
  port: z.number().int().positive(),
  handlers: z.array(z.string()),
});

const machineServiceSchema = z.object({
  protocol: z.enum(["tcp", "udp"]),
  internal_port: z.number().int().positive(),
  autostart: z.boolean().optional(),
  autostop: z.enum(["off", "stop", "suspend"]).optional(),
  min_machines_running: z.number().int().nonnegative().optional(),
  ports: z.array(machinePortSchema),
});

const machineConfigSchema = z.object({
  image: z.string().min(1),
  env: z.record(z.string(), z.string()),
  init: machineInitSchema.optional(),
  guest: machineGuestSchema,
  mounts: z.array(machineMountSchema),
  files: z.array(machineFileSchema).optional(),
  restart: machineRestartSchema,
  services: z.array(machineServiceSchema),
});

const createMachineRequestSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  config: machineConfigSchema,
});

const execMachineRequestSchema = z.object({
  command: z.array(z.string()).min(1),
  timeout: z.number().int().positive().optional(),
});

const machineSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  state: z.string().optional(),
  instance_id: z.string().optional(),
  updated_at: z.string().optional(),
});

const volumeSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  state: z.string().optional(),
});

const assignIpRequestSchema = z.object({
  type: z.enum(["shared_v4", "v6"]),
});

const execResponseSchema = z.object({
  exit_code: z.number().optional(),
  stderr: z.string().optional(),
  stdout: z.string().optional(),
});

const schema = createSchema(
  {
    "@post/apps": {
      input: createAppRequestSchema,
    },
    "@delete/apps/:app_name": {},
    "@post/apps/:app_name/ip_assignments": {
      input: assignIpRequestSchema,
    },
    "@post/apps/:app_name/volumes": {
      input: createVolumeRequestSchema,
      output: volumeSchema,
    },
    "@get/apps/:app_name/volumes": {
      output: z.array(volumeSchema),
    },
    "@delete/apps/:app_name/volumes/:volume_id": {
      output: volumeSchema,
    },
    "@get/apps/:app_name/machines": {
      output: z.array(machineSchema),
    },
    "@post/apps/:app_name/machines": {
      input: createMachineRequestSchema,
      output: machineSchema,
    },
    "@get/apps/:app_name/machines/:machine_id": {
      output: machineSchema,
    },
    "@post/apps/:app_name/machines/:machine_id/start": {},
    "@post/apps/:app_name/machines/:machine_id/stop": {},
    "@post/apps/:app_name/machines/:machine_id/restart": {},
    "@delete/apps/:app_name/machines/:machine_id": {},
    "@post/apps/:app_name/machines/:machine_id/exec": {
      input: execMachineRequestSchema,
      output: execResponseSchema,
    },
  },
  { strict: true },
);

const sdk = createFetch({
  baseURL: API_BASE_URL,
  schema,
  throw: true,
  headers: {
    Authorization: `Bearer ${env.FLY_API_TOKEN}`,
    Accept: "application/json",
  },
});

export type CreateAppRequest = z.infer<typeof createAppRequestSchema>;
export type CreateVolumeRequest = z.infer<typeof createVolumeRequestSchema>;
export type MachineGuest = z.infer<typeof machineGuestSchema>;
export type MachineMount = z.infer<typeof machineMountSchema>;
export type MachineFile = z.infer<typeof machineFileSchema>;
export type MachineInit = z.infer<typeof machineInitSchema>;
export type MachineRestart = z.infer<typeof machineRestartSchema>;
export type MachinePort = z.infer<typeof machinePortSchema>;
export type MachineService = z.infer<typeof machineServiceSchema>;
export type MachineConfig = z.infer<typeof machineConfigSchema>;
export type CreateMachineRequest = z.infer<typeof createMachineRequestSchema>;
export type ExecMachineRequest = z.infer<typeof execMachineRequestSchema>;
export type Machine = z.infer<typeof machineSchema>;
export type Volume = z.infer<typeof volumeSchema>;
export type AssignIpRequest = z.infer<typeof assignIpRequestSchema>;
export type ExecResponse = z.infer<typeof execResponseSchema>;

export const createApp = async (input: CreateAppRequest) => {
  return sdk("@post/apps", {
    body: input,
  });
};

export const deleteApp = async (appName: string, force = false) => {
  return sdk("@delete/apps/:app_name", {
    params: { app_name: appName },
    query: force ? { force: "true" } : undefined,
  });
};

export const assignAppIp = async (appName: string, input: AssignIpRequest) => {
  await sdk("@post/apps/:app_name/ip_assignments", {
    params: { app_name: appName },
    body: input,
  });
};

export const createVolume = async (
  appName: string,
  input: CreateVolumeRequest,
) => {
  return sdk("@post/apps/:app_name/volumes", {
    params: { app_name: appName },
    body: input,
  });
};

export const listVolumes = async (appName: string) => {
  return sdk("@get/apps/:app_name/volumes", {
    params: { app_name: appName },
  });
};

export const deleteVolume = async (appName: string, volumeId: string) => {
  return sdk("@delete/apps/:app_name/volumes/:volume_id", {
    params: {
      app_name: appName,
      volume_id: volumeId,
    },
  });
};

export const listMachines = async (appName: string) => {
  return sdk("@get/apps/:app_name/machines", {
    params: { app_name: appName },
  });
};

export const createMachine = async (
  appName: string,
  input: CreateMachineRequest,
) => {
  return sdk("@post/apps/:app_name/machines", {
    params: { app_name: appName },
    body: input,
  });
};

export const getMachine = async (appName: string, machineId: string) => {
  return sdk("@get/apps/:app_name/machines/:machine_id", {
    params: {
      app_name: appName,
      machine_id: machineId,
    },
  });
};

export const startMachine = async (appName: string, machineId: string) => {
  return sdk("@post/apps/:app_name/machines/:machine_id/start", {
    params: {
      app_name: appName,
      machine_id: machineId,
    },
  });
};

export const stopMachine = async (appName: string, machineId: string) => {
  return sdk("@post/apps/:app_name/machines/:machine_id/stop", {
    params: {
      app_name: appName,
      machine_id: machineId,
    },
  });
};

export const restartMachine = async (appName: string, machineId: string) => {
  return sdk("@post/apps/:app_name/machines/:machine_id/restart", {
    params: {
      app_name: appName,
      machine_id: machineId,
    },
  });
};

export const deleteMachine = async (
  appName: string,
  machineId: string,
  force = false,
) => {
  return sdk("@delete/apps/:app_name/machines/:machine_id", {
    params: {
      app_name: appName,
      machine_id: machineId,
    },
    query: force ? { force: "true" } : undefined,
  });
};

export const execMachine = async (
  appName: string,
  machineId: string,
  input: ExecMachineRequest,
) => {
  return sdk("@post/apps/:app_name/machines/:machine_id/exec", {
    params: {
      app_name: appName,
      machine_id: machineId,
    },
    body: input,
  });
};

const logEventSchema = z.object({
  message: z.string().optional(),
});

const logPayloadSchema = z.object({
  timestamp: z.string().optional(),
  message: z.string().optional(),
  msg: z.string().optional(),
  text: z.string().optional(),
  instance: z.string().optional(),
  region: z.string().optional(),
  event: logEventSchema.optional(),
});

const logEnvelopeSchema = z.looseObject({
  attributes: logPayloadSchema,
});

const logRecordSchema = z.union([logEnvelopeSchema, logPayloadSchema]);

const logsJsonResponseSchema = z.union([
  z.array(logRecordSchema),
  z.object({
    data: z.array(logRecordSchema),
  }),
]);

type LogPayload = z.infer<typeof logPayloadSchema>;
type LogRecord = z.infer<typeof logRecordSchema>;

const MESSAGE_TIMESTAMP_PREFIX =
  /^(?:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?|\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})\s+/;

const toPayload = (record: LogRecord): LogPayload =>
  "attributes" in record ? record.attributes : record;

const toLogMessage = (record: LogPayload) => {
  const message = stripAnsi(
    record.message ?? record.msg ?? record.text ?? record.event?.message ?? "",
  );

  if (!record.timestamp) {
    return message;
  }

  return message.replace(MESSAGE_TIMESTAMP_PREFIX, "");
};

const toLogEntry = (record: LogPayload): LogEntry | null => {
  const message = toLogMessage(record);
  if (!message) {
    return null;
  }

  return {
    timestamp: record.timestamp ?? null,
    message,
  };
};

const parseJsonLogsOutput = (raw: string): LogEntry[] | null => {
  try {
    const parsed = logsJsonResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return null;
    }

    const records = Array.isArray(parsed.data) ? parsed.data : parsed.data.data;

    return records
      .map((record) => toLogEntry(toPayload(record)))
      .filter((entry): entry is LogEntry => entry !== null);
  } catch {
    return null;
  }
};

const parseNdjsonLogsOutput = (raw: string): LogEntry[] =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map<LogEntry>((line) => {
      try {
        const parsed = logRecordSchema.safeParse(JSON.parse(line));
        if (!parsed.success) {
          return parseTextLogLine(line);
        }

        const entry = toLogEntry(toPayload(parsed.data));
        if (!entry) {
          return parseTextLogLine(line);
        }

        return entry;
      } catch {
        return parseTextLogLine(line);
      }
    });

const parseLogsOutput = (raw: string): LogEntry[] =>
  parseJsonLogsOutput(raw) ?? parseNdjsonLogsOutput(raw);

const toStartTime = (cursor: string, hoursBack = 24): string => {
  const d = new Date(cursor);
  d.setHours(d.getHours() - hoursBack);
  return d.toISOString();
};

export const getMachineLogs = async (
  appName: string,
  machineId: string,
  params?: LogsPageParams,
) => {
  const limit = params?.limit ?? 50;
  const query = new URLSearchParams({
    instance: machineId,
    no_tail: "true",
  });

  if (params?.cursor) {
    query.set("start_time", toStartTime(params.cursor));
  }

  const response = await fetch(
    `${LOGS_API_BASE_URL}/apps/${encodeURIComponent(appName)}/logs?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: env.FLY_API_TOKEN,
        Accept: "application/x-ndjson, application/json, text/plain",
      },
      signal: AbortSignal.timeout(20_000),
    },
  );

  if (!response.ok) {
    throw new Error(`Could not fetch Fly logs (HTTP ${response.status}).`);
  }

  const raw = await response.text();
  let entries = parseLogsOutput(raw);

  if (params?.cursor) {
    const cursor = params.cursor;
    entries = entries
      .filter((e): e is LogEntry & { timestamp: string } =>
        Boolean(e.timestamp && e.timestamp < cursor),
      )
      .slice(-limit);
  } else {
    entries = entries.slice(-limit);
  }

  const nextCursor =
    entries.length > 0 && entries[0]?.timestamp ? entries[0].timestamp : null;

  return { entries, nextCursor };
};
