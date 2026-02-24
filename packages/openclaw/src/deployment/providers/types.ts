import type { DeployInstanceSchemaInput } from "../schema";

export interface OpenClawDeploymentProviderStrategy {
  deploy: (input: DeployInstanceSchemaInput & { userId: string }) => Promise<{
    id: string;
    url: string;
  }>;
  getStatus: (id: string) => Promise<{ status: string | null } | null>;
  cli: (id: string, command: string) => Promise<{ stdout: string }>;
  start: (id: string) => Promise<{ stdout: string }>;
  stop: (id: string) => Promise<{ stdout: string }>;
  restart: (id: string) => Promise<{ stdout: string }>;
  destroy: (id: string) => Promise<{ stdout: string }>;
  getLogs: (id: string) => Promise<{ stdout: string }>;
}
