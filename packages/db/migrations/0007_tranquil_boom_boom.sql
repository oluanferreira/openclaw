CREATE TABLE "affiliate" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"referral_code" text NOT NULL,
	"referral_slug" text,
	"wallet_address" text,
	"status" text DEFAULT 'active' NOT NULL,
	"activated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "affiliate_referral_code_unique" UNIQUE("referral_code"),
	CONSTRAINT "affiliate_referral_slug_unique" UNIQUE("referral_slug")
);
--> statement-breakpoint
CREATE TABLE "affiliate_payout" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliate_id" text NOT NULL,
	"amount_usdt" numeric(10, 2) NOT NULL,
	"period_month" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"tx_hash" text,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliate_id" text NOT NULL,
	"referred_user_id" text NOT NULL,
	"stripe_invoice_id" text NOT NULL,
	"gross_amount" numeric(10, 2) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"period_month" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliate" ADD CONSTRAINT "affiliate_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_payout" ADD CONSTRAINT "affiliate_payout_affiliate_id_affiliate_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliate"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission" ADD CONSTRAINT "commission_affiliate_id_affiliate_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."affiliate"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission" ADD CONSTRAINT "commission_referred_user_id_user_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_affiliate_code" ON "affiliate" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "idx_affiliate_slug" ON "affiliate" USING btree ("referral_slug");--> statement-breakpoint
CREATE INDEX "idx_payout_affiliate" ON "affiliate_payout" USING btree ("affiliate_id");--> statement-breakpoint
CREATE INDEX "idx_payout_status" ON "affiliate_payout" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_commission_affiliate" ON "commission" USING btree ("affiliate_id");--> statement-breakpoint
CREATE INDEX "idx_commission_status" ON "commission" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_commission_period" ON "commission" USING btree ("period_month");