CREATE TYPE "public"."site_status" AS ENUM('active', 'neutralized');--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"approx_count" integer NOT NULL,
	"operator" varchar(120),
	"notes" varchar(1000),
	"status" "site_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lat_range" CHECK ("sites"."lat" between -90 and 90),
	CONSTRAINT "lng_range" CHECK ("sites"."lng" between -180 and 180),
	CONSTRAINT "approx_count_range" CHECK ("sites"."approx_count" between 1 and 100000)
);
--> statement-breakpoint
CREATE INDEX "idx_sites_status" ON "sites" USING btree ("status");