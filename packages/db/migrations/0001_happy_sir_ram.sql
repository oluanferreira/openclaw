CREATE TABLE "openclaw_instance" (
	"user_id" text PRIMARY KEY NOT NULL,
	"container_id" text NOT NULL,
	"gateway_port" integer NOT NULL,
	"gateway_url" text NOT NULL,
	"log_path" text NOT NULL,
	"status" text DEFAULT 'deploying' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "openclaw_instance" ADD CONSTRAINT "openclaw_instance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "openclaw_instance_container_idx" ON "openclaw_instance" USING btree ("container_id");