import { Hono } from "hono";

import { getActiveModels } from "./models-config";

export const modelsRouter = new Hono().get("/", async (c) => {
  const models = await getActiveModels();
  return c.json(models);
});
