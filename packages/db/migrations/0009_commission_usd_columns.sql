ALTER TABLE "commission" ADD COLUMN "gross_amount_usd" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "commission" ADD COLUMN "commission_amount_usd" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "commission" ADD COLUMN "exchange_rate" numeric(12, 6);