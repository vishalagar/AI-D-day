import { eq, inArray, sql } from "drizzle-orm";

import {
  APPROVE_THRESHOLD,
  REJECT_THRESHOLD,
  type VoteValue,
} from "@/lib/config/moderation";

import { getDb } from "../client";
import { type Site, siteVotes } from "../schema";

/**
 * Records a vote and re-derives the site's tally and moderation state in a
 * single statement.
 *
 * It has to be one statement: the Neon HTTP driver has no transactions, so
 * two round-trips could interleave with a concurrent voter and persist a
 * stale count. The tally is recomputed from `site_votes` (the source of
 * truth) rather than incremented, so even a lost update self-heals on the
 * next vote instead of drifting permanently.
 *
 * The `existing UNION ALL incoming` shape is load-bearing: CTEs all see the
 * snapshot from the start of the statement, so a plain `count(*)` over
 * `site_votes` would miss the row the `upsert` CTE is inserting right now.
 *
 * Transition rules, in priority order:
 *   - locked (seeded) rows never change moderation state at all
 *   - net <= REJECT_THRESHOLD  -> rejected
 *   - net >= APPROVE_THRESHOLD *and the review window has closed* -> approved
 *   - already approved         -> stays approved (promotion is sticky, so a
 *                                 couple of late downvotes can't quietly pull
 *                                 a confirmed site back off the map)
 *   - otherwise                -> pending
 *
 * Rejection is deliberately not gated on the window: obvious junk should
 * leave the queue immediately, or reviewers stop working through it.
 *
 * Because promotion only happens inside this statement, a row that clears
 * the threshold early and then gets no further votes would sit pending
 * forever. `settleDueSites` is the other half of the mechanism.
 */
export async function castVote(
  siteId: string,
  voterKey: string,
  value: VoteValue,
): Promise<Site | undefined> {
  const rows = await getDb().execute(sql`
    with upsert as (
      insert into site_votes (site_id, voter_key, value)
      values (${siteId}, ${voterKey}, ${value})
      on conflict (site_id, voter_key)
        do update set value = excluded.value, created_at = now()
      returning value
    ),
    tally as (
      select
        count(*) filter (where v = 1)  as up,
        count(*) filter (where v = -1) as down
      from (
        select value as v from site_votes
          where site_id = ${siteId} and voter_key <> ${voterKey}
        union all
        select value from upsert
      ) all_votes
    )
    update sites set
      upvotes = tally.up,
      downvotes = tally.down,
      moderation = case
        when sites.locked then sites.moderation
        when (tally.up - tally.down) <= ${REJECT_THRESHOLD} then 'rejected'
        when (tally.up - tally.down) >= ${APPROVE_THRESHOLD}
          and sites.voting_ends_at <= now() then 'approved'
        when sites.moderation = 'approved' then 'approved'
        else 'pending'
      end,
      updated_at = now()
    from tally
    where sites.id = ${siteId}
    returning sites.*;
  `);

  return (rows.rows[0] as unknown as Site | undefined) ?? undefined;
}

/** The voter's own ballots, so the UI can show which way they already voted. */
export async function getVotesByVoter(
  voterKey: string,
  siteIds: string[],
): Promise<Record<string, VoteValue>> {
  if (siteIds.length === 0) return {};

  const rows = await getDb()
    .select({ siteId: siteVotes.siteId, value: siteVotes.value })
    .from(siteVotes)
    .where(
      sql`${eq(siteVotes.voterKey, voterKey)} and ${inArray(siteVotes.siteId, siteIds)}`,
    );

  return Object.fromEntries(
    rows.map((row) => [row.siteId, row.value as VoteValue]),
  );
}

/** Clears a site's ballots — used when an edit invalidates prior consensus. */
export async function clearVotes(siteId: string): Promise<void> {
  await getDb().delete(siteVotes).where(eq(siteVotes.siteId, siteId));
}
