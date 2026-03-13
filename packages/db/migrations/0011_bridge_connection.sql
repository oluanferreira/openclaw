CREATE TABLE IF NOT EXISTS "bridge_connection" (
  "id" text PRIMARY KEY NOT NULL,
  "instance_id" text NOT NULL UNIQUE REFERENCES "instance"("id") ON DELETE CASCADE,
  "last_seen" timestamp,
  "device_name" text,
  "app_version" text,
  "capabilities" jsonb NOT NULL DEFAULT '{"browser":true,"terminal":true,"clipboard":false,"notifications":true}',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
