import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "../lib/zod";

import type * as z from "zod";

export const vpsServer = pgTable("vps_server", {
  id: text().primaryKey(),
  name: text().notNull(),
  location: text().notNull(),
  endpoint: text().notNull().default("local"),
  token: text().default(""),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVpsServerSchema = createInsertSchema(vpsServer);
export const selectVpsServerSchema = createSelectSchema(vpsServer);
export const updateVpsServerSchema = createUpdateSchema(vpsServer);

export type SelectVpsServer = z.infer<typeof selectVpsServerSchema>;
export type InsertVpsServer = z.infer<typeof insertVpsServerSchema>;
export type UpdateVpsServer = z.infer<typeof updateVpsServerSchema>;
