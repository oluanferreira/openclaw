import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

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
  vpsId: text().notNull().default("vps-main"),
  openaiApiKey: text(),
  anthropicApiKey: text(),
  googleApiKey: text(),
  communicationToken: text("communication_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInstanceSchema = createInsertSchema(instance);
export const selectInstanceSchema = createSelectSchema(instance);
export const updateInstanceSchema = createUpdateSchema(instance);

export type SelectInstance = z.infer<typeof selectInstanceSchema>;
export type InsertInstance = z.infer<typeof insertInstanceSchema>;
export type UpdateInstance = z.infer<typeof updateInstanceSchema>;

export const instanceSkill = pgTable("instance_skill", {
  id: text()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  instanceId: text("instance_id")
    .notNull()
    .references(() => instance.id, { onDelete: "cascade" }),
  skillName: text("skill_name").notNull(),
  enabled: boolean().notNull().default(false),
  credentials: jsonb().$type<Record<string, string>>().default({}),
  config: jsonb().$type<Record<string, unknown>>().default({}),
  source: text("source").default("curated"),
  installedAt: timestamp("installed_at"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInstanceSkillSchema = createInsertSchema(instanceSkill);
export const selectInstanceSkillSchema = createSelectSchema(instanceSkill);

export type SelectInstanceSkill = z.infer<typeof selectInstanceSkillSchema>;
export type InsertInstanceSkill = z.infer<typeof insertInstanceSkillSchema>;
