-- Make instance_id nullable and drop FK constraint on bridge_audit_log
-- This allows logging failed auth attempts where instance is unknown

ALTER TABLE "bridge_audit_log" ALTER COLUMN "instance_id" DROP NOT NULL;
ALTER TABLE "bridge_audit_log" DROP CONSTRAINT IF EXISTS "bridge_audit_log_instance_id_instance_id_fk";
ALTER TABLE "bridge_audit_log" DROP CONSTRAINT IF EXISTS "bridge_audit_log_instance_id_fkey";
