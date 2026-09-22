ALTER TABLE "sites" ADD COLUMN "voting_ends_at" timestamp with time zone DEFAULT now() + interval '24 hours' NOT NULL;--> statement-breakpoint
-- Backfill from each row's own submission time rather than leaving the
-- column default's `now() + 24h`, which would restart the clock on entries
-- that have already been sitting in the queue. Rows older than the window
-- come out already closed, which is the correct state for them.
UPDATE "sites" SET "voting_ends_at" = "created_at" + interval '24 hours';--> statement-breakpoint
CREATE INDEX "idx_sites_moderation_voting_ends_at" ON "sites" USING btree ("moderation","voting_ends_at");
