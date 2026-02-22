import { Client } from "ssh2";

import type { ClientChannel } from "ssh2";

interface RunRemoteScriptOptions {
  timeoutMs?: number;
}

export interface SshTarget {
  host: string;
  port: number;
  username: string;
  privateKey: string;
  passphrase?: string;
}

export interface RunRemoteScriptResult {
  stdout: string;
  stderr: string;
}

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

const normalizePrivateKey = (value: string) => value.replaceAll("\\n", "\n");

const executeScript = async (
  target: SshTarget,
  script: string,
  options?: RunRemoteScriptOptions,
): Promise<RunRemoteScriptResult> => {
  const client = new Client();
  const stdout: string[] = [];
  const stderr: string[] = [];

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      client.end();
      reject(new Error("Remote command timed out."));
    }, options?.timeoutMs ?? DEFAULT_TIMEOUT_MS);

    const fail = (error: Error) => {
      clearTimeout(timeout);
      reject(error);
    };

    client
      .on("ready", () => {
        client.exec(
          "bash -s",
          (error: Error | undefined, stream: ClientChannel) => {
            if (error) {
              fail(error);
              return;
            }

            stream.on("close", (code: number | undefined) => {
              clearTimeout(timeout);
              client.end();

              if (code === 0) {
                resolve();
                return;
              }

              reject(
                new Error(
                  `Remote command failed with exit code ${code ?? -1}. ${stderr.join("") || stdout.join("")}`.trim(),
                ),
              );
            });

            stream.on("data", (chunk: Buffer) => {
              stdout.push(chunk.toString("utf8"));
            });

            stream.stderr.on("data", (chunk: Buffer) => {
              stderr.push(chunk.toString("utf8"));
            });

            stream.end(script);
          },
        );
      })
      .on("error", fail)
      .connect({
        host: target.host,
        port: target.port,
        username: target.username,
        privateKey: normalizePrivateKey(target.privateKey),
        passphrase: target.passphrase,
      });
  });

  return {
    stdout: stdout.join(""),
    stderr: stderr.join(""),
  };
};

export const runRemoteScript = async (
  target: SshTarget,
  script: string,
  options?: RunRemoteScriptOptions,
) => executeScript(target, script, options);
