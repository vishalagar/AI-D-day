import { sql } from "drizzle-orm";

import { APPROVE_THRESHOLD } from "@/lib/config/moderation";

import { getDb } from "../client";

/**
 * Promotes every pending entry whose review window has closed while already
 * over the approval threshold.
 *
 * The vote statement can only act on the site being voted on, so an entry
 * that clears +3 in its first hour and then never gets another ballot would
 * stay pending forever — its window closes with nothing running to notice.
 * This is what notices.
 *
 * Called on read rather than from a scheduled job: there is no cron, no
 * queue and no admin in this project, and a board nobody is looking at
 * doesn't need settling. It touches only rows that already qualify, so the
 * common case is an indexed scan that updates nothing.
 *
 * Rejection is not settled here — that transition isn't gated on the window,
 * so it has always already happened by the time a vote returns.
 *
 * @returns how many entries were promoted.
 */
export async function settleDueSites(): Promise<number> {
  const result = await getDb().execute(sql`
    update sites set
      moderation = 'approved',
      updated_at = now()
    where moderation = 'pending'
      and not locked
      and voting_ends_at <= now()
      and (upvotes - downvotes) >= ${APPROVE_THRESHOLD}
    returning id;
  `);

  return result.rows.length;
}
