/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { createInsertSchema, createSelectSchema } from "../lib/zod";

import { user } from "./auth";

import type * as z from "zod";

// ─── Affiliate ───────────────────────────────────────────────

export const affiliate = pgTable(
  "affiliate",
  {
    id: text().primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    referralCode: text("referral_code").notNull().unique(),
    referralSlug: text("referral_slug").unique(),
    walletAddress: text("wallet_address"),
    parentAffiliateId: text("parent_affiliate_id").references(
      (): AnyPgColumn => affiliate.id,
      { onDelete: "set null" },
    ),
    status: text({ enum: ["active", "suspended"] })
      .default("active")
      .notNull(),
    activatedAt: timestamp("activated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_affiliate_code").on(t.referralCode),
    index("idx_affiliate_slug").on(t.referralSlug),
    index("idx_affiliate_parent").on(t.parentAffiliateId),
  ],
);

// ─── Commission ──────────────────────────────────────────────

export const commission = pgTable(
  "commission",
  {
    id: text().primaryKey(),
    affiliateId: text("affiliate_id")
      .notNull()
      .references(() => affiliate.id, { onDelete: "cascade" }),
    referredUserId: text("referred_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "set null" }),
    stripeInvoiceId: text("stripe_invoice_id").notNull(),
    grossAmount: numeric("gross_amount", { precision: 10, scale: 2 }).notNull(),
    commissionAmount: numeric("commission_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    currency: text().notNull(),
    tier: text({ enum: ["tier1", "tier2", "tier3"] })
      .default("tier1")
      .notNull(),
    status: text({ enum: ["pending", "paid", "voided"] })
      .default("pending")
      .notNull(),
    periodMonth: text("period_month").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_commission_affiliate").on(t.affiliateId),
    index("idx_commission_status").on(t.status),
    index("idx_commission_period").on(t.periodMonth),
  ],
);

// ─── Affiliate Payout ────────────────────────────────────────

export const affiliatePayout = pgTable(
  "affiliate_payout",
  {
    id: text().primaryKey(),
    affiliateId: text("affiliate_id")
      .notNull()
      .references(() => affiliate.id, { onDelete: "cascade" }),
    amountUsdt: numeric("amount_usdt", { precision: 10, scale: 2 }).notNull(),
    periodMonth: text("period_month").notNull(),
    status: text({ enum: ["pending", "paid", "failed"] })
      .default("pending")
      .notNull(),
    txHash: text("tx_hash"),
    paidAt: timestamp("paid_at"),
    notes: text(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_payout_affiliate").on(t.affiliateId),
    index("idx_payout_status").on(t.status),
  ],
);

// ─── Relations ───────────────────────────────────────────────

export const affiliateRelations = relations(affiliate, ({ one, many }) => ({
  user: one(user, { fields: [affiliate.userId], references: [user.id] }),
  parent: one(affiliate, {
    fields: [affiliate.parentAffiliateId],
    references: [affiliate.id],
    relationName: "parentChild",
  }),
  children: many(affiliate, { relationName: "parentChild" }),
  commissions: many(commission),
  payouts: many(affiliatePayout),
}));

export const commissionRelations = relations(commission, ({ one }) => ({
  affiliate: one(affiliate, {
    fields: [commission.affiliateId],
    references: [affiliate.id],
  }),
  referredUser: one(user, {
    fields: [commission.referredUserId],
    references: [user.id],
  }),
}));

export const affiliatePayoutRelations = relations(
  affiliatePayout,
  ({ one }) => ({
    affiliate: one(affiliate, {
      fields: [affiliatePayout.affiliateId],
      references: [affiliate.id],
    }),
  }),
);

// ─── Zod Schemas ─────────────────────────────────────────────

export const insertAffiliateSchema = createInsertSchema(affiliate);
export const selectAffiliateSchema = createSelectSchema(affiliate);
export const insertCommissionSchema = createInsertSchema(commission);
export const selectCommissionSchema = createSelectSchema(commission);
export const insertAffiliatePayoutSchema = createInsertSchema(affiliatePayout);
export const selectAffiliatePayoutSchema = createSelectSchema(affiliatePayout);

// ─── Types ───────────────────────────────────────────────────

export type AffiliateStatus = "active" | "suspended";
export type CommissionStatus = "pending" | "paid" | "voided";
export type CommissionTier = "tier1" | "tier2" | "tier3";
export type PayoutStatus = "pending" | "paid" | "failed";
export type SelectAffiliate = z.infer<typeof selectAffiliateSchema>;
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type SelectCommission = z.infer<typeof selectCommissionSchema>;
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type SelectAffiliatePayout = z.infer<typeof selectAffiliatePayoutSchema>;
export type InsertAffiliatePayout = z.infer<typeof insertAffiliatePayoutSchema>;
