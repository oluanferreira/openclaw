import type { DeployInstanceSchemaInput } from "../schema";

export interface OpenClawInstanceStatus {
  status: string | null;
}

export interface OpenClawDeploymentProviderStrategy {
  deploy: (input: DeployInstanceSchemaInput & { userId: string }) => Promise<{
    id: string;
    url: string;
  }>;
  getStatus: (instanceId: string) => Promise<OpenClawInstanceStatus | null>;
}
