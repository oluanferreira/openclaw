-- Add file_config column to bridge_connection
ALTER TABLE "bridge_connection"
ADD COLUMN "file_config" jsonb DEFAULT '{"allowedDirs":[],"blockedPatterns":[".env*","*.pem","*.key",".ssh/","credentials*","*.p12","*.pfx"]}'::jsonb NOT NULL;

-- Update capabilities to include files field (default false)
UPDATE "bridge_connection"
SET "capabilities" = "capabilities" || '{"files": false}'::jsonb
WHERE NOT ("capabilities" ? 'files');
