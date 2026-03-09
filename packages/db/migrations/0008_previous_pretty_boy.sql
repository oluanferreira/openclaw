ALTER TABLE "affiliate" ADD COLUMN "parent_affiliate_id" text;--> statement-breakpoint
ALTER TABLE "commission" ADD COLUMN "tier" text DEFAULT 'tier1' NOT NULL;--> statement-breakpoint
ALTER TABLE "affiliate" ADD CONSTRAINT "affiliate_parent_affiliate_id_affiliate_id_fk" FOREIGN KEY ("parent_affiliate_id") REFERENCES "public"."affiliate"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_affiliate_parent" ON "affiliate" USING btree ("parent_affiliate_id");