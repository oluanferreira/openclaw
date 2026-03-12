import { logger } from "@workspace/shared/logger";

import { getGatewayConfig } from "../../../config/gateway";
import {
  escapeShell,
  getGatewayToken,
  getInstanceId,
  toEscapedCommand,
} from "../../utils";

import { env as flyEnv } from "./env";
import {
  assignAppIp,
  createApp,
  createMachine,
  createVolume,
  deleteApp,
  execMachine,
  deleteMachine,
  deleteVolume,
  listMachines,
  restartMachine,
  startMachine,
  stopMachine,
  getMachineLogs,
} from "./sdk";

import type { DeployInstanceSchemaInput } from "../../schema";
import type { OpenClawDeploymentProviderStrategy } from "../types";
import type { Machine } from "./sdk";

const toVolumeName = (instanceId: string) => `data_${instanceId}`;

const toGatewayConfigPath = () =>
  `${flyEnv.FLY_OPENCLAW_STATE_DIR}/openclaw.json`;

const toBootstrapGatewayConfigPath = () => "/tmp/openclaw.json";

const getInitExecScript = (gatewayPort: number) => `set -eu
cp ${escapeShell(toBootstrapGatewayConfigPath())} ${escapeShell(toGatewayConfigPath())}
rm -f ${escapeShell(`${flyEnv.FLY_OPENCLAW_STATE_DIR}/gateway.*.lock`)}
exec node /app/dist/index.js gateway --port ${gatewayPort} --bind lan`;

const getUrl = (id: string, token?: string) =>
  `https://${id}.fly.dev${token ? `/#token=${encodeURIComponent(token)}` : ""}`;

const toLatestMachine = (machines: Machine[]) => {
  return [...machines]
    .filter((machine) => machine.state !== "destroyed")
    .sort((left, right) => {
      const leftTime = left.updated_at ? Date.parse(left.updated_at) : 0;
      const rightTime = right.updated_at ? Date.parse(right.updated_at) : 0;
      return rightTime - leftTime;
    })[0];
};

const getMachineOrThrow = async (id: string) => {
  const machine = toLatestMachine(await listMachines(id));

  if (!machine?.id) {
    throw new Error(`No active Fly machine found for app ${id}.`);
  }

  return machine;
};

export const strategy = {
  deploy: async ({
    userId,
    ...input
  }: DeployInstanceSchemaInput & { userId: string }) => {
    const id = getInstanceId(userId);
    const token = getGatewayToken();

    let appCreated = false;
    let volumeId: string | null = null;
    let machineId: string | null = null;

    try {
      await createApp({
        name: id,
        org_slug: flyEnv.FLY_ORG_SLUG,
        enable_subdomains: true,
      });
      appCreated = true;

      await Promise.all([
        assignAppIp(id, { type: "shared_v4" }),
        assignAppIp(id, { type: "v6" }),
      ]);

      const volume = await createVolume(id, {
        name: toVolumeName(id),
        region: flyEnv.FLY_REGION,
        size_gb: flyEnv.FLY_VOLUME_SIZE_GB,
      });

      volumeId = volume.id;

      const origin = getUrl(id);
      const gatewayConfig = getGatewayConfig({ origin, token, ...input });

      const machine = await createMachine(id, {
        name: id,
        region: flyEnv.FLY_REGION,
        config: {
          image: flyEnv.FLY_OPENCLAW_IMAGE,
          env: {
            NODE_ENV: "production",
            NODE_OPTIONS: "--max-old-space-size=1536",
            OPENCLAW_STATE_DIR: flyEnv.FLY_OPENCLAW_STATE_DIR,
            OPENCLAW_GATEWAY_TOKEN: token,
          },
          init: {
            exec: ["sh", "-c", getInitExecScript(gatewayConfig.gateway.port)],
          },
          files: [
            {
              guest_path: toBootstrapGatewayConfigPath(),
              raw_value: Buffer.from(
                JSON.stringify(gatewayConfig, null, 2),
                "utf8",
              ).toString("base64"),
              mode: 0o600,
            },
          ],
          guest: {
            cpu_kind: "shared",
            cpus: flyEnv.FLY_MACHINE_CPUS,
            memory_mb: flyEnv.FLY_MACHINE_MEMORY_MB,
          },
          mounts: [
            {
              path: flyEnv.FLY_OPENCLAW_STATE_DIR,
              volume: volume.id,
            },
          ],
          restart: {
            policy: "always",
          },
          services: [
            {
              protocol: "tcp",
              internal_port: gatewayConfig.gateway.port,
              autostart: true,
              autostop: "off",
              min_machines_running: 1,
              ports: [
                {
                  port: 80,
                  handlers: ["http"],
                },
                {
                  port: 443,
                  handlers: ["tls", "http"],
                },
              ],
            },
          ],
        },
      });

      machineId = machine.id;

      return {
        id,
        token,
      };
    } catch (error) {
      if (machineId) {
        await deleteMachine(id, machineId, true);
      }

      if (volumeId) {
        await deleteVolume(id, volumeId);
      }

      if (appCreated) {
        await deleteApp(id);
      }

      throw error;
    }
  },
  getStatus: async (id) => {
    try {
      const machine = toLatestMachine(await listMachines(id));

      if (!machine) {
        return null;
      }

      return {
        status: machine.state?.toLowerCase() ?? null,
      };
    } catch (error) {
      logger.error(error);
      return null;
    }
  },
  cli: async (id, commandArgs) => {
    try {
      const machine = await getMachineOrThrow(id);
      const cliCommand = toEscapedCommand([
        "node",
        "/app/dist/index.js",
        ...commandArgs,
      ]);
      const result = await execMachine(id, machine.id, {
        command: [
          "timeout",
          "-s",
          "9",
          "45",
          "su",
          "-s",
          "/bin/sh",
          "-c",
          cliCommand,
          "node",
        ],
        timeout: 45,
      });

      const exitCode = result.exit_code ?? 0;
      if (exitCode !== 0 && exitCode !== 124) {
        throw new Error(
          (
            result.stderr ??
            result.stdout ??
            "Fly machine command failed."
          ).trim(),
        );
      }

      return {
        stdout: result.stdout ?? "",
        stderr: result.stderr ?? "",
      };
    } catch (error) {
      logger.error(error);
      throw error;
    }
  },
  start: async (id) => {
    const machine = await getMachineOrThrow(id);
    await startMachine(id, machine.id);
  },
  stop: async (id) => {
    const machine = await getMachineOrThrow(id);
    await stopMachine(id, machine.id);
  },
  restart: async (id) => {
    const machine = await getMachineOrThrow(id);
    await restartMachine(id, machine.id);
  },
  destroy: async (id) => {
    await deleteApp(id, true);
  },
  getLogs: async (id, params) => {
    const machine = await getMachineOrThrow(id);
    return getMachineLogs(id, machine.id, params);
  },
  getUrl,
} satisfies OpenClawDeploymentProviderStrategy;
