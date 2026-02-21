import * as z from "zod";

import { Model } from "./ai";
import { communicationChannelConfigSchema } from "./communication";

export const createAssistantSchema = z.object({
  model: z.enum(Model),
  communication: communicationChannelConfigSchema,
});

export type CreateAssistantSchemaInput = z.input<typeof createAssistantSchema>;
