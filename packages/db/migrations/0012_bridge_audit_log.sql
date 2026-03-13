CREATE TABLE IF NOT EXISTS "bridge_audit_log" (
  "id" text PRIMARY KEY NOT NULL,
  "instance_id" text NOT NULL REFERENCES "instance"("id") ON DELETE CASCADE,
  "action" text NOT NULL,
  "params" jsonb,
  "result" text NOT NULL,
  "duration_ms" integer,
  "ip_address" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "bridge_audit_log_instance_idx" ON "bridge_audit_log" ("instance_id");
CREATE INDEX IF NOT EXISTS "bridge_audit_log_action_idx" ON "bridge_audit_log" ("action");
CREATE INDEX IF NOT EXISTS "bridge_audit_log_created_idx" ON "bridge_audit_log" ("created_at");
