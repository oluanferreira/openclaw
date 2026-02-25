import * as z from "zod";

import { Model } from "./ai";
import { communicationChannelConfigSchema } from "./communication";

export const openclawConfigSchema = z.object({
  model: z.enum(Model),
  communication: communicationChannelConfigSchema,
});

export type OpenclawConfig = z.infer<typeof openclawConfigSchema>;
