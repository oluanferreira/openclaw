import { Hono } from "hono";

import {
  deployInstanceSchema,
  logsPageParamsSchema,
  ManageInstanceAction,
  manageInstanceSchema,
} from "@workspace/openclaw";
import {
  createInstance,
  deploy,
  getStatus,
  getLogs,
  getInstanceByUserId,
  manage,
  deleteInstance,
  getUrl,
} from "@workspace/openclaw/server";

import {
  enforceAuth,
  validate,
  enforceInstance,
  enforceNoInstance,
  enforceActiveSubscription,
} from "../../middleware";
import { pairingRouter } from "./pairing/router";

export const openclawRouter = new Hono()
  .use(enforceAuth)
  .post(
    "/",
    enforceNoInstance,
    enforceActiveSubscription,
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
  .get("/status", enforceInstance, enforceActiveSubscription, async (c) =>
    c.json(await getStatus(c.var.instanceId)),
  )
  .get(
    "/logs",
    enforceInstance,
    enforceActiveSubscription,
    validate("query", logsPageParamsSchema),
    async (c) => c.json(await getLogs(c.var.instanceId, c.req.valid("query"))),
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
  .route("/pairing", pairingRouter);
