import type { DeployInstanceSchemaInput, AiKeysInput } from "../schema";

export interface OpenClawDeploymentProviderStrategy {
  deploy: (
    input: DeployInstanceSchemaInput & { userId: string },
  ) => Promise<{ id: string; token: string }>;
  getStatus: (id: string) => Promise<{ status: string | null } | null>;
  cli: (
    id: string,
    commandArgs: readonly string[],
  ) => Promise<{ stdout: string }>;
  start: (id: string) => Promise<{ stdout: string }>;
  stop: (id: string) => Promise<{ stdout: string }>;
  restart: (id: string) => Promise<{ stdout: string }>;
  destroy: (id: string) => Promise<{ stdout: string }>;
  getLogs: (id: string) => Promise<{ stdout: string }>;
  getUrl: (id: string) => string;
  updateKeys: (id: string, aiKeys: AiKeysInput, model?: string, token?: string) => Promise<{ stdout: string }>;
}
