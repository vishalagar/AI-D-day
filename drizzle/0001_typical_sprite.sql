CREATE TYPE "public"."site_moderation" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "site_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"voter_key" varchar(64) NOT NULL,
	"value" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vote_value" CHECK ("site_votes"."value" in (-1, 1))
);
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "source_url" varchar(500);--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "moderation" "site_moderation" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "upvotes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "downvotes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "site_votes" ADD CONSTRAINT "site_votes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_site_voter" ON "site_votes" USING btree ("site_id","voter_key");--> statement-breakpoint
CREATE INDEX "idx_site_votes_site" ON "site_votes" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_sites_moderation" ON "sites" USING btree ("moderation");--> statement-breakpoint
-- Backfill: rows that existed before moderation was introduced were visible
-- on the map, and the new column's 'pending' default would silently hide all
-- of them. Grandfather them in as approved instead.
UPDATE "sites" SET "moderation" = 'approved' WHERE "created_at" < now();