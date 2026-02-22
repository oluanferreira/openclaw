import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const openclawInstance = pgTable(
  "openclaw_instance",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    containerId: text("container_id").notNull(),
    gatewayPort: integer("gateway_port").notNull(),
    gatewayUrl: text("gateway_url").notNull(),
    logPath: text("log_path").notNull(),
    status: text("status").notNull().default("deploying"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("openclaw_instance_container_idx").on(table.containerId)],
);
