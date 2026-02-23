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
  getInstanceIdFromHeaders,
  getInstanceByUserId,
  manage,
  deleteInstance,
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

    return c.json(instance);
  })
  .get("/status", enforceInstance, async (c) => {
    const status = await getStatus(c.var.instanceId);

    return c.json(status);
  })
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
  })
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
  );
