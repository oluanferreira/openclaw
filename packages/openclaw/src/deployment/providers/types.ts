import type {
  DeployInstanceSchemaInput,
  LogsPageParams,
  LogsPageResponse,
} from "../schema";

export interface OpenClawDeploymentProviderStrategy {
  deploy: (
    input: DeployInstanceSchemaInput & { userId: string },
  ) => Promise<{ id: string; token: string }>;
  getStatus: (id: string) => Promise<{ status: string | null } | null>;
  cli: (
    id: string,
    commandArgs: readonly string[],
  ) => Promise<{ stdout?: string; stderr?: string }>;
  start: (id: string) => Promise<{ stdout?: string; stderr?: string } | void>;
  stop: (id: string) => Promise<{ stdout?: string; stderr?: string } | void>;
  restart: (id: string) => Promise<{ stdout?: string; stderr?: string } | void>;
  destroy: (id: string) => Promise<{ stdout?: string; stderr?: string } | void>;
  getLogs: (id: string, params?: LogsPageParams) => Promise<LogsPageResponse>;
  getUrl: (id: string) => string;
}
