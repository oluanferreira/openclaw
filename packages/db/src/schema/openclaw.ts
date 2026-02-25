import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "../lib/zod";

import { user } from "./auth";

import type * as z from "zod";

export const instance = pgTable("instance", {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  model: text().notNull(),
  communicationChannel: text().notNull(),
  token: text().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInstanceSchema = createInsertSchema(instance);
export const selectInstanceSchema = createSelectSchema(instance);
export const updateInstanceSchema = createUpdateSchema(instance);

export type SelectInstance = z.infer<typeof selectInstanceSchema>;
export type InsertInstance = z.infer<typeof insertInstanceSchema>;
export type UpdateInstance = z.infer<typeof updateInstanceSchema>;
