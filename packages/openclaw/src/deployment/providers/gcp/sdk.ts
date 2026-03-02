import { InstancesClient } from "@google-cloud/compute";
import { OsLoginServiceClient } from "@google-cloud/os-login";
import { GoogleAuth } from "google-auth-library";
import { Client } from "ssh2";
import { generatePrivateKey } from "sshpk";

import { env } from "./env";

import type { ClientChannel } from "ssh2";

const credentials = env.GCP_CREDENTIALS
  ? (JSON.parse(
      Buffer.from(env.GCP_CREDENTIALS, "base64").toString("utf-8"),
    ) as { client_email?: string; private_key?: string })
  : undefined;

const auth = new GoogleAuth({
  scopes: "https://www.googleapis.com/auth/cloud-platform",
  credentials,
});

export const instancesClient = new InstancesClient({ auth });
const osLoginClient = new OsLoginServiceClient({ auth });

let queue = Promise.resolve<void>(undefined);

const runSerialized = <T>(fn: () => Promise<T>) => {
  const next = queue.then(fn);
  queue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
};

export const executeOnInstance = async (
  instanceId: string,
  commandArgs: readonly string[],
) =>
  runSerialized(async () => {
    if (!credentials?.client_email) {
      return {
        stdout: "",
        stderr: "GCP_CREDENTIALS not configured; CLI execution disabled.",
      };
    }

    const [instance] = await instancesClient.get({
      project: env.GCP_PROJECT_ID,
      zone: env.GCP_ZONE,
      instance: instanceId,
    });

    const externalIp =
      instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP ?? null;
    if (!externalIp) {
      throw new Error(
        `Instance ${instanceId} has no external IP (may be stopped or still starting).`,
      );
    }

    const keyPair = generatePrivateKey("ed25519");
    const privateKey = keyPair.toString("openssh");
    const publicKey = keyPair.toPublic().toString("ssh");

    const [result] = await osLoginClient.importSshPublicKey({
      parent: `users/${credentials.client_email}`,
      sshPublicKey: {
        key: publicKey,
        expirationTimeUsec: ((Date.now() + 5 * 60 * 1000) * 1000).toString(),
      },
      projectId: env.GCP_PROJECT_ID,
    });

    const username =
      result.loginProfile?.posixAccounts?.[0]?.username ??
      credentials.client_email.replace(/[^a-zA-Z0-9]/g, "_");

    const client = new Client();
    const stdout: string[] = [];
    const stderr: string[] = [];

    const stateDir = env.GCP_OPENCLAW_STATE_DIR;
    const escapedArgs = commandArgs
      .map((a) => `'${a.replaceAll("'", "'\"'\"'")}'`)
      .join(" ");
    const script = `sudo -n env OPENCLAW_STATE_DIR=${stateDir} openclaw ${escapedArgs}`;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        client.end();
        reject(new Error("SSH command timed out."));
      }, 60_000);

      const fail = (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      };

      client
        .on("ready", () => {
          client.exec(
            script,
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
                } else {
                  reject(
                    new Error(
                      `Command failed with exit code ${code ?? -1}. ${stderr.join("") || stdout.join("")}`.trim(),
                    ),
                  );
                }
              });

              stream.on("data", (chunk: Buffer) => {
                stdout.push(chunk.toString("utf8"));
              });

              stream.stderr.on("data", (chunk: Buffer) => {
                stderr.push(chunk.toString("utf8"));
              });
            },
          );
        })
        .on("error", fail)
        .connect({
          host: externalIp,
          port: 22,
          username,
          privateKey,
        });
    });
    return {
      stdout: stdout.join(""),
      stderr: stderr.join(""),
    };
  });
