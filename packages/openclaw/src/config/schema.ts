import * as z from "zod";

import { communicationChannelConfigSchema } from "./communication";

export const openclawConfigSchema = z.object({
  model: z.string().min(1),
  communication: communicationChannelConfigSchema,
  locale: z.string().optional(),
});

export type OpenclawConfig = z.infer<typeof openclawConfigSchema>;
