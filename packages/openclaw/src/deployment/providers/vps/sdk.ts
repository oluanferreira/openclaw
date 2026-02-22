import { Client } from "ssh2";

import { env } from "./env";

import type { ClientChannel } from "ssh2";

interface RunRemoteScriptOptions {
  timeout?: number;
}

export interface RunRemoteScriptResult {
  stdout: string;
  stderr: string;
}

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

const normalizePrivateKey = (value: string) => value.replaceAll("\\n", "\n");

export const execute = async (
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
    }, options?.timeout ?? DEFAULT_TIMEOUT_MS);

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
        host: env.VPS_HOST,
        port: env.VPS_SSH_PORT,
        username: env.VPS_USER,
        privateKey: normalizePrivateKey(env.VPS_PRIVATE_KEY),
        passphrase: env.VPS_PRIVATE_KEY_PASSPHRASE,
      });
  });

  return {
    stdout: stdout.join(""),
    stderr: stderr.join(""),
  };
};

export const parseOutput = (stdout: string) => {
  const lines = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const pairs = lines.map((line) => {
    const separator = line.indexOf("=");
    if (separator <= 0) {
      return null;
    }
    return [line.slice(0, separator), line.slice(separator + 1)] as const;
  });

  return Object.fromEntries(
    pairs.filter((pair): pair is readonly [string, string] => Boolean(pair)),
  );
};
