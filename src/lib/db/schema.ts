import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/** The satire game-state: has the community "taken this one out" yet. */
export const siteStatusEnum = pgEnum("site_status", ["active", "neutralized"]);

/**
 * The trust state. Submissions start `pending` and are hidden from the main
 * map until the community votes them onto it; heavily downvoted entries fall
 * to `rejected` and disappear. This is the only spam control — there is no
 * account system and no admin.
 */
export const siteModerationEnum = pgEnum("site_moderation", [
  "pending",
  "approved",
  "rejected",
]);

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    approxCount: integer("approx_count").notNull(),
    operator: varchar("operator", { length: 120 }),
    notes: varchar("notes", { length: 1000 }),
    /** Public citation backing the entry. Seeded rows always carry one. */
    sourceUrl: varchar("source_url", { length: 500 }),
    status: siteStatusEnum("status").notNull().default("active"),
    moderation: siteModerationEnum("moderation").notNull().default("pending"),
    upvotes: integer("upvotes").notNull().default(0),
    downvotes: integer("downvotes").notNull().default(0),
    /**
     * Seeded reference entries. Locked rows still collect votes (the tally is
     * shown) but can never be voted off the map or edited — they are the
     * sourced anchor set that keeps the map useful if voting is brigaded.
     */
    locked: boolean("locked").notNull().default(false),
    /**
     * End of the mandatory review window. A pending row cannot be promoted
     * before this instant no matter how fast it clears the threshold. Stored
     * as the deadline rather than derived from `createdAt` so that changing
     * the window length never retroactively moves entries already in review,
     * and so an edit that resets the claim can restart the clock.
     */
    votingEndsAt: timestamp("voting_ends_at", { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '24 hours'`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_sites_status").on(table.status),
    index("idx_sites_moderation").on(table.moderation),
    // The settle pass filters on both, in this order.
    index("idx_sites_moderation_voting_ends_at").on(
      table.moderation,
      table.votingEndsAt,
    ),
    check("lat_range", sql`${table.lat} between -90 and 90`),
    check("lng_range", sql`${table.lng} between -180 and 180`),
    check("approx_count_range", sql`${table.approxCount} between 1 and 100000`),
  ],
);

/**
 * One row per (site, voter). `voterKey` is a salted hash of a browser-local
 * token plus the request IP — anonymous, but stable enough to stop the
 * cheapest form of ballot stuffing. Re-voting overwrites the prior row.
 */
export const siteVotes = pgTable(
  "site_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    voterKey: varchar("voter_key", { length: 64 }).notNull(),
    /** +1 to confirm the site, -1 to dispute it. */
    value: smallint("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uniq_site_voter").on(table.siteId, table.voterKey),
    index("idx_site_votes_site").on(table.siteId),
    check("vote_value", sql`${table.value} in (-1, 1)`),
  ],
);

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;
export type SiteVote = typeof siteVotes.$inferSelect;
export type SiteModeration = Site["moderation"];
