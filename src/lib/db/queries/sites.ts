import { and, desc, eq, sql } from "drizzle-orm";

import { getDb } from "../client";
import {
  type NewSite,
  type Site,
  type SiteModeration,
  sites,
} from "../schema";

const LIST_LIMIT = 5000;
const PENDING_LIMIT = 200;

/** Sites that survived review — the ones drawn on the main map. */
export async function listApprovedSites(): Promise<Site[]> {
  return getDb()
    .select()
    .from(sites)
    .where(eq(sites.moderation, "approved"))
    .limit(LIST_LIMIT);
}

/**
 * The review queue. Newest first so a fresh submission is the first thing a
 * reviewer sees — an old entry nobody will ever confirm shouldn't sit at the
 * top of the pile forever.
 */
export async function listPendingSites(): Promise<Site[]> {
  return getDb()
    .select()
    .from(sites)
    .where(eq(sites.moderation, "pending"))
    .orderBy(desc(sites.createdAt))
    .limit(PENDING_LIMIT);
}

export async function listSitesByModeration(
  moderation: SiteModeration,
): Promise<Site[]> {
  return moderation === "pending"
    ? listPendingSites()
    : getDb()
        .select()
        .from(sites)
        .where(eq(sites.moderation, moderation))
        .limit(LIST_LIMIT);
}

/** Most recent activity across the map, for the live ticker. */
export async function listRecentSites(limit = 8): Promise<Site[]> {
  return getDb()
    .select()
    .from(sites)
    .where(sql`${sites.moderation} <> 'rejected'`)
    .orderBy(desc(sites.updatedAt))
    .limit(limit);
}

export async function getSiteById(id: string): Promise<Site | undefined> {
  const rows = await getDb()
    .select()
    .from(sites)
    .where(eq(sites.id, id))
    .limit(1);
  return rows[0];
}

/**
 * Guards against the same campus being logged twice under slightly different
 * names. ~0.05 degrees is roughly 5km — close enough that two pins would
 * overlap at any usable zoom level.
 */
const DUPLICATE_RADIUS_DEGREES = 0.05;

export async function findNearbySite(
  lat: number,
  lng: number,
): Promise<Site | undefined> {
  const rows = await getDb()
    .select()
    .from(sites)
    .where(
      and(
        sql`abs(${sites.lat} - ${lat}) < ${DUPLICATE_RADIUS_DEGREES}`,
        sql`abs(${sites.lng} - ${lng}) < ${DUPLICATE_RADIUS_DEGREES}`,
        sql`${sites.moderation} <> 'rejected'`,
      ),
    )
    .limit(1);
  return rows[0];
}

export async function createSite(input: NewSite): Promise<Site> {
  const rows = await getDb().insert(sites).values(input).returning();
  return rows[0];
}

export type UpdateSiteFields = Partial<
  Omit<NewSite, "id" | "createdAt" | "updatedAt">
>;

export async function updateSite(
  id: string,
  fields: UpdateSiteFields,
): Promise<Site | undefined> {
  const rows = await getDb()
    .update(sites)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(sites.id, id))
    .returning();
  return rows[0];
}
