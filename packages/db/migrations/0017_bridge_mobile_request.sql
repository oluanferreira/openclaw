-- Bridge Mobile Request Queue (CB-3.4)
CREATE TABLE IF NOT EXISTS bridge_mobile_request (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  instance_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  args JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '3 minutes'
);

CREATE INDEX idx_mobile_request_instance_status ON bridge_mobile_request(instance_id, status);
CREATE INDEX idx_mobile_request_expires ON bridge_mobile_request(expires_at) WHERE status = 'pending';

-- Add device_type to bridge_connection for desktop/mobile distinction
ALTER TABLE bridge_connection ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'desktop';

-- Drop the old unique constraint on instance_id and add composite unique
-- First check if old unique exists and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bridge_connection_instance_id_unique'
    AND conrelid = 'bridge_connection'::regclass
  ) THEN
    ALTER TABLE bridge_connection DROP CONSTRAINT bridge_connection_instance_id_unique;
  END IF;
END $$;

-- Add composite unique constraint
ALTER TABLE bridge_connection ADD CONSTRAINT bridge_connection_instance_device_unique
  UNIQUE (instance_id, device_type);
