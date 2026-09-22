import { neon } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

/**
 * Clears leftover community submissions before the e2e run starts. Raw SQL
 * (not the app's Drizzle client) — importing that module chain from inside
 * Playwright's own config loader trips a Node ESM/CJS interop error. Goes
 * straight to the DB, bypassing the rate-limited HTTP API, so a prior failed
 * run's leftovers can't collide with marker selection in this run.
 *
 * Locked rows are the seeded reference set and are deliberately spared —
 * wiping them would empty the map and force a re-seed before every run.
 * Votes cascade from the sites they belong to.
 */
export default async function globalSetup() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set for e2e global setup.");
  const sql = neon(url);
  await sql`DELETE FROM sites WHERE locked = false`;
}
