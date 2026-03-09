import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { createInsertSchema, createSelectSchema } from "../lib/zod";

import { user } from "./auth";

import type * as z from "zod";

export const supportTicket = pgTable("support_ticket", {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  subject: text().notNull(),
  description: text().notNull(),
  status: text({ enum: ["open", "in_progress", "closed"] })
    .default("open")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ticketReply = pgTable("ticket_reply", {
  id: text().primaryKey(),
  ticketId: text()
    .notNull()
    .references(() => supportTicket.id, { onDelete: "cascade" }),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  message: text().notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ticketAttachment = pgTable("ticket_attachment", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id")
    .notNull()
    .references(() => supportTicket.id, { onDelete: "cascade" }),
  replyId: text("reply_id").references(() => ticketReply.id, {
    onDelete: "cascade",
  }),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  storedName: text("stored_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSupportTicketSchema = createInsertSchema(supportTicket);
export const selectSupportTicketSchema = createSelectSchema(supportTicket);
export const insertTicketReplySchema = createInsertSchema(ticketReply);
export const selectTicketReplySchema = createSelectSchema(ticketReply);
export const insertTicketAttachmentSchema =
  createInsertSchema(ticketAttachment);
export const selectTicketAttachmentSchema =
  createSelectSchema(ticketAttachment);

export type TicketStatus = "open" | "in_progress" | "closed";
export type SelectSupportTicket = z.infer<typeof selectSupportTicketSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SelectTicketReply = z.infer<typeof selectTicketReplySchema>;
export type InsertTicketReply = z.infer<typeof insertTicketReplySchema>;
export type SelectTicketAttachment = z.infer<
  typeof selectTicketAttachmentSchema
>;
export type InsertTicketAttachment = z.infer<
  typeof insertTicketAttachmentSchema
>;
