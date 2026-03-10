import { execute, escapeShell } from "./sdk";

import type { RunRemoteScriptResult } from "./sdk";

/**
 * Execute a clawhub CLI command inside a container.
 *
 * Runs: docker exec <instanceId> sh -c 'HOME=/opt/openclaw /opt/openclaw/.local/bin/clawhub <args> --workdir /opt/openclaw --dir skills --no-input'
 */
export const clawhubExec = async (
  instanceId: string,
  args: string[],
): Promise<RunRemoteScriptResult> => {
  const script = `docker exec ${escapeShell(instanceId)} sh -c ${escapeShell(
    `HOME=/opt/openclaw /opt/openclaw/.local/bin/clawhub ${args.join(" ")} --workdir /opt/openclaw --dir skills --no-input`,
  )}`;

  return execute(script);
};
