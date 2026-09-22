import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { sites } from "@/lib/db/schema";

/**
 * Test-only teardown. The app itself has no delete path — discarding an
 * entry is the community's call, made by downvote — so this lives here
 * rather than in the production query layer where it would be a loaded gun.
 */
export async function deleteSiteForTest(id: string): Promise<void> {
  await getDb().delete(sites).where(eq(sites.id, id));
}

/**
 * Backdates a site's mandatory review window so promotion can be tested
 * without waiting 24 hours for it.
 */
export async function closeVotingWindowForTest(id: string): Promise<void> {
  await getDb()
    .update(sites)
    .set({ votingEndsAt: new Date(Date.now() - 60_000) })
    .where(eq(sites.id, id));
}

let coordinateSeed = 0;

/**
 * Coordinates far enough apart to clear the ~5km duplicate guard, so tests
 * that each create a site don't collide with one another.
 */
export function uniqueTestCoords(): { lat: number; lng: number } {
  coordinateSeed += 1;
  return {
    lat: -60 + ((coordinateSeed * 0.7) % 100),
    lng: -170 + ((coordinateSeed * 1.3) % 300),
  };
}
