import { sql } from "drizzle-orm";

import { getDb } from "../client";
import { sites, siteVotes } from "../schema";

export interface SiteStats {
  totalSites: number;
  totalApproxDatacenters: number;
  activeCount: number;
  neutralizedCount: number;
  pendingCount: number;
  votesCast: number;
}

/**
 * Headline numbers describe the confirmed map only — counting unreviewed
 * submissions would let one spammer inflate the totals on the front page,
 * which is exactly what the review queue exists to prevent. `pendingCount`
 * is reported separately as a call to action, not folded into the totals.
 */
export async function getStats(): Promise<SiteStats> {
  const approved = sql`${sites.moderation} = 'approved'`;

  const [siteRows, voteRows] = await Promise.all([
    getDb()
      .select({
        totalSites: sql<number>`count(*) filter (where ${approved})`,
        totalApproxDatacenters: sql<number>`coalesce(sum(${sites.approxCount}) filter (where ${approved}), 0)`,
        activeCount: sql<number>`count(*) filter (where ${approved} and ${sites.status} = 'active')`,
        neutralizedCount: sql<number>`count(*) filter (where ${approved} and ${sites.status} = 'neutralized')`,
        pendingCount: sql<number>`count(*) filter (where ${sites.moderation} = 'pending')`,
      })
      .from(sites),
    getDb().select({ votesCast: sql<number>`count(*)` }).from(siteVotes),
  ]);

  const row = siteRows[0];
  return {
    totalSites: Number(row?.totalSites ?? 0),
    totalApproxDatacenters: Number(row?.totalApproxDatacenters ?? 0),
    activeCount: Number(row?.activeCount ?? 0),
    neutralizedCount: Number(row?.neutralizedCount ?? 0),
    pendingCount: Number(row?.pendingCount ?? 0),
    votesCast: Number(voteRows[0]?.votesCast ?? 0),
  };
}
