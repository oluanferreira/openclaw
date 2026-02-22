import * as z from "zod";

import { Model } from "./ai";
import { communicationChannelConfigSchema } from "./communication";

export const deployInstanceSchema = z.object({
  model: z.enum(Model),
  communication: communicationChannelConfigSchema,
});

export type DeployInstanceSchemaInput = z.input<typeof deployInstanceSchema>;
