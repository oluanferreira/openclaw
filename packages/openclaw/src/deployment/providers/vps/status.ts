import { logger } from "@workspace/shared/logger";

import { escapeShell } from "../../utils";

import { execute, parseOutput } from "./sdk";

const getStatusScript = (instanceId: string) => `
set -euo pipefail

CONTAINER_NAME=${escapeShell(instanceId)}

if ! docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  echo "status=not_found"
  exit 0
fi

STATUS=$(docker inspect --format '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || true)

echo "status=$STATUS"
`;

export const getStatus = async (instanceId: string) => {
  try {
    const { stdout } = await execute(getStatusScript(instanceId), {
      timeout: 30_000,
    });

    const output = parseOutput(stdout);

    return {
      status: output.status ?? null,
    };
  } catch (error) {
    logger.error(error);
    return null;
  }
};
