import { Hono } from "hono";

import { deployInstanceSchema } from "@workspace/openclaw";

import { enforceAuth, validate } from "../../middleware";

export const openclawRouter = new Hono().post(
  "/",
  enforceAuth,
  validate("json", deployInstanceSchema),
  async (c) => {
    return c.json({}, 202);
  },
);
