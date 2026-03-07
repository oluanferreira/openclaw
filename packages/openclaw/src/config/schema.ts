import * as z from "zod";

import { MODELS } from "./ai";
import { communicationChannelConfigSchema } from "./communication";

export const openclawConfigSchema = z.object({
  model: z.enum(MODELS.map((m) => m.id) as [string, ...string[]]),
  communication: communicationChannelConfigSchema,
});

export type OpenclawConfig = z.infer<typeof openclawConfigSchema>;
