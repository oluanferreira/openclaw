import { Hono } from "hono";

import {
  deployInstanceSchema,
  ManageInstanceAction,
  manageInstanceSchema,
} from "@workspace/openclaw";
import {
  createInstance,
  deploy,
  getInstanceById,
  getStatus,
  getLogs,
  getInstanceIdFromHeaders,
  getInstanceByUserId,
  manage,
  deleteInstance,
  getUrl,
} from "@workspace/openclaw/server";
import { HttpStatusCode } from "@workspace/shared/constants";
import { HttpException } from "@workspace/shared/utils";

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
        id: deployment.id,
        userId,
        communicationChannel: payload.communication.channel,
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

    const url = getUrl(instance.id);
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
  .get("/access", async (c) => {
    const userId = c.var.user.id;
    const instanceId = getInstanceIdFromHeaders(c.req.raw.headers);

    if (!instanceId) {
      throw new HttpException(HttpStatusCode.BAD_REQUEST, {
        message: "error.notFound",
      });
    }

    const instance = await getInstanceById(instanceId);

    if (instance?.userId !== userId) {
      throw new HttpException(HttpStatusCode.FORBIDDEN, {
        code: "error.forbidden",
      });
    }

    c.header("X-Forwarded-User", instance.userId);
    return c.json({ ok: true });
  });
