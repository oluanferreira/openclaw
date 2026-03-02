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
} from "../../middleware";

export const openclawRouter = new Hono()
  .use(enforceAuth)
  .post(
    "/",
    enforceNoInstance,
    validate("json", deployInstanceSchema),
    async (c) => {
      const userId = c.var.user.id;
      const payload = c.req.valid("json");

      const deployment = await deploy({ userId, ...payload });
      await createInstance({
        userId,
        communicationChannel: payload.communication.channel,
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

      await manage(instanceId, payload.action);

      if (payload.action === ManageInstanceAction.DESTROY) {
        await deleteInstance(instanceId);
      }

      return c.json({ success: true });
    },
  )
  .post("/cli", enforceInstance, validate("json", commandSchema), async (c) => {
    const instanceId = c.var.instanceId;
    const payload = c.req.valid("json");

    const command = getCommandToRun(payload);

    return c.json(await cli(instanceId, command));
  });
