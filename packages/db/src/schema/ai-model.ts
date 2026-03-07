import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "../lib/zod";

import type * as z from "zod";

export const aiModel = pgTable("ai_model", {
  id: text().primaryKey(),
  provider: text().notNull(),
  name: text().notNull(),
  tier: text().notNull().default("flagship"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiModelSchema = createInsertSchema(aiModel);
export const selectAiModelSchema = createSelectSchema(aiModel);
export const updateAiModelSchema = createUpdateSchema(aiModel);

export type SelectAiModel = z.infer<typeof selectAiModelSchema>;
export type InsertAiModel = z.infer<typeof insertAiModelSchema>;
export type UpdateAiModel = z.infer<typeof updateAiModelSchema>;
