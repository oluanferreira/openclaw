import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { createInsertSchema, createSelectSchema } from "../lib/zod";

import { user } from "./auth";

import type * as z from "zod";

export const subscription = pgTable("subscription", {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  status: text().notNull().default("inactive"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscription);
export const selectSubscriptionSchema = createSelectSchema(subscription);

export type SelectSubscription = z.infer<typeof selectSubscriptionSchema>;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
