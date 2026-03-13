-- Add terminal_config JSONB to bridge_connection for CB-2.1
ALTER TABLE "bridge_connection"
  ADD COLUMN IF NOT EXISTS "terminal_config" jsonb
  DEFAULT '{"allowlist":["git *","npm *","pnpm *","ls","pwd","cat","echo","node --version"],"workingDir":null,"timeoutSeconds":30}'::jsonb
  NOT NULL;
