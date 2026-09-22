/**
 * Inserts the curated reference sites as locked, pre-approved rows.
 *
 * Idempotent: re-running updates the existing row's content in place rather
 * than creating duplicates, so the dataset can be corrected and re-seeded
 * safely. Matching is by (name, locked) — community submissions are never
 * touched even if a name collides.
 *
 *   npx tsx scripts/seed.ts
 */
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq } from "drizzle-orm";

import { SEED_SITES } from "../src/lib/seed";
import { sites } from "../src/lib/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Run `vercel env pull` first.");
  }

  const db = drizzle(neon(url), { schema: { sites } });

  let inserted = 0;
  let updated = 0;

  for (const seed of SEED_SITES) {
    const row = {
      ...seed,
      moderation: "approved" as const,
      status: "active" as const,
      locked: true,
    };

    const existing = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.name, seed.name), eq(sites.locked, true)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(sites)
        .set({ ...row, updatedAt: new Date() })
        .where(eq(sites.id, existing[0].id));
      updated += 1;
    } else {
      await db.insert(sites).values(row);
      inserted += 1;
    }
  }

  console.log(
    `Seed complete: ${inserted} inserted, ${updated} updated (${SEED_SITES.length} total).`,
  );
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
