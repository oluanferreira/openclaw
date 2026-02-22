import { Hono } from "hono";

import { deployInstanceSchema } from "@workspace/openclaw";
import { createInstance, deploy } from "@workspace/openclaw/server";

import { enforceAuth, validate } from "../../middleware";

export const openclawRouter = new Hono().post(
  "/",
  enforceAuth,
  validate("json", deployInstanceSchema),
  async (c) => {
    const userId = c.var.user.id;
    const payload = c.req.valid("json");

    const id = await deploy({ userId, ...payload });
    await createInstance({ id, userId });
    return c.json({ id }, 202);
  },
);
