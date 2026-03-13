ALTER TABLE "bridge_connection"
ADD COLUMN "notification_config" jsonb
DEFAULT '{"allowedTypes":["info","alert","action"],"soundEnabled":true,"quietHoursStart":null,"quietHoursEnd":null}'::jsonb
NOT NULL;
