import { Hono } from "hono";

import {
  deployInstanceSchema,
  ManageInstanceAction,
  manageInstanceSchema,
} from "@workspace/openclaw";
import { getCommandToRun, commandSchema } from "@workspace/openclaw/cli";
import {
  createInstance,
  deploy,
  getStatus,
  getLogs,
  getInstanceByUserId,
  manage,
  deleteInstance,
  getUrl,
  getPairingRequests,
  cli,
} from "@workspace/openclaw/server";

import {
  enforceAuth,
  validate,
  enforceInstance,
  enforceNoInstance,
  enforceSubscription,
} from "../../middleware";

import { selectBestVps } from "../admin/vps-selector";
import { getVpsById } from "../admin/vps-config";

export const openclawRouter = new Hono()
  .use(enforceAuth)
  .post(
    "/",
    enforceNoInstance,
    enforceSubscription,
    validate("json", deployInstanceSchema),
    async (c) => {
      const userId = c.var.user.id;
      const payload = c.req.valid("json");

      // Seleciona a melhor VPS (menor uso de recursos)
      const vpsId = await selectBestVps();
      const vps = await getVpsById(vpsId);

      let deployment: { id: string; token: string };

      if (!vps || vps.endpoint === "local") {
        // Deploy local (VPS principal)
        deployment = await deploy({ userId, ...payload });
      } else {
        // Deploy remoto via agent HTTP
        const res = await fetch(`${vps.endpoint}/deploy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${vps.token ?? ""}`,
          },
          body: JSON.stringify({ userId, ...payload }),
          signal: AbortSignal.timeout(120000),
        });

        if (!res.ok) {
          const error = await res.text().catch(() => "Unknown error");
          throw new Error(`Remote deploy failed on ${vps.name}: ${error}`);
        }

        deployment = await res.json() as { id: string; token: string };
      }

      await createInstance({
        userId,
        communicationChannel: payload.communication.channel,
        vpsId,
        ...deployment,
        ...payload,
      });

      return c.json(deployment, 202);
    },
  )
  .get("/", async (c) => {
    const userId = c.var.user.id;
    const instance = await getInstanceByUserId(userId);

    if (!instance) {
      return c.json(null);
    }

    const url = getUrl(instance.id, instance.token);
    return c.json({
      ...instance,
      url,
    });
  })
  .get("/status", enforceInstance, async (c) =>
    c.json(await getStatus(c.var.instanceId)),
  )
  .get("/logs", enforceInstance, async (c) =>
    c.json(await getLogs(c.var.instanceId)),
  )
  .get("/pairing", enforceInstance, async (c) =>
    c.json(await getPairingRequests(c.var.instanceId)),
  )
  .post(
    "/manage",
    enforceInstance,
    validate("json", manageInstanceSchema),
    async (c) => {
      const instanceId = c.var.instanceId;
      const payload = c.req.valid("json");

      const result = await manage(instanceId, payload.action);

      if (payload.action === ManageInstanceAction.DESTROY) {
        await deleteInstance(instanceId);
      }

      return c.json(result);
    },
  )
  .post("/cli", enforceInstance, validate("json", commandSchema), async (c) => {
    const instanceId = c.var.instanceId;
    const payload = c.req.valid("json");

    const command = getCommandToRun(payload);

    return c.json(await cli(instanceId, command));
  });
