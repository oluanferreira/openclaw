import { Hono } from "hono";
import * as z from "zod";

import {
  getDevicePairingList,
  getChannelPairingList,
  cli,
} from "@workspace/openclaw/server";

import {
  enforceAuth,
  enforceActiveSubscription,
  enforceInstance,
  validate,
} from "../../../middleware";

const pairingDevicesRouter = new Hono<{
  Variables: {
    instanceId: string;
  };
}>()
  .get("/", async (c) => c.json(await getDevicePairingList(c.var.instanceId)))
  .post("/:id", async (c) =>
    c.json(
      await cli(c.var.instanceId, ["devices", "approve", c.req.param("id")]),
    ),
  )
  .delete("/:id", async (c) =>
    c.json(
      await cli(c.var.instanceId, ["devices", "reject", c.req.param("id")]),
    ),
  );

const pairingChannelsRouter = new Hono<{
  Variables: {
    instanceId: string;
  };
}>()
  .get("/", async (c) => c.json(await getChannelPairingList(c.var.instanceId)))
  .post(
    "/:channel",
    validate(
      "json",
      z.object({
        code: z.string(),
      }),
    ),
    async (c) =>
      c.json(
        await cli(c.var.instanceId, [
          "pairing",
          "approve",
          c.req.param("channel"),
          c.req.valid("json").code,
        ]),
      ),
  )
  .delete(
    "/:channel",
    validate(
      "json",
      z.object({
        code: z.string(),
      }),
    ),
    async (c) =>
      c.json(
        await cli(c.var.instanceId, [
          "pairing",
          "reject",
          c.req.param("channel"),
          c.req.valid("json").code,
        ]),
      ),
  );

export const pairingRouter = new Hono()
  .use(enforceAuth)
  .use(enforceInstance)
  .use(enforceActiveSubscription)
  .route("/devices", pairingDevicesRouter)
  .route("/channels", pairingChannelsRouter);
