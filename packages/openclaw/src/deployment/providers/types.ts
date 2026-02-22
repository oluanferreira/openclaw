import type { DeployInstanceSchemaInput } from "../schema";

export interface OpenClawDeploymentProviderStrategy {
  deploy: (
    input: DeployInstanceSchemaInput & { userId: string },
  ) => Promise<string>;
}
