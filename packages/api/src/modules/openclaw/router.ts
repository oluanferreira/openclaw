import { Hono } from "hono";

import { deployInstanceSchema } from "@workspace/openclaw";
import {
  createInstance,
  deploy,
  getInstanceById,
  getStatus,
  getInstanceIdFromHeaders,
  getInstanceByUserId,
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

    console.log("userId", userId);
    console.log("instanceId", instanceId);

    if (!instanceId) {
      throw new HttpException(HttpStatusCode.BAD_REQUEST, {
        message: "Invalid instance host.",
      });
    }

    console.log("instanceId", instanceId);
    const instance = await getInstanceById(instanceId);
    console.log("instance", instance);

    if (instance?.userId !== userId) {
      throw new HttpException(HttpStatusCode.FORBIDDEN, {
        code: "error.forbidden",
      });
    }

    c.header("X-Forwarded-User", instance.userId);

    return c.json({ ok: true });
  });
