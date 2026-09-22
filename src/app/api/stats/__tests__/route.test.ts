import { afterEach, describe, expect, it } from "vitest";

import { createSite } from "@/lib/db/queries/sites";
import { deleteSiteForTest, uniqueTestCoords } from "@/test-utils/db";

import { GET } from "../route";

const createdIds: string[] = [];

afterEach(async () => {
  while (createdIds.length > 0) {
    const id = createdIds.pop();
    if (id) await deleteSiteForTest(id).catch(() => undefined);
  }
});

interface Stats {
  totalSites: number;
  totalApproxDatacenters: number;
  activeCount: number;
  neutralizedCount: number;
  pendingCount: number;
  votesCast: number;
}

const readStats = async (): Promise<Stats> =>
  (await (await GET()).json()) as Stats;

describe("GET /api/stats", () => {
  it("counts approved sites in the headline aggregates", async () => {
    const before = await readStats();

    const active = await createSite({
      name: "Stats Test Active",
      ...uniqueTestCoords(),
      approxCount: 7,
      moderation: "approved",
    });
    createdIds.push(active.id);

    const neutralized = await createSite({
      name: "Stats Test Neutralized",
      ...uniqueTestCoords(),
      approxCount: 3,
      status: "neutralized",
      moderation: "approved",
    });
    createdIds.push(neutralized.id);

    const after = await readStats();

    expect(after.totalSites).toBe(before.totalSites + 2);
    expect(after.totalApproxDatacenters).toBe(
      before.totalApproxDatacenters + 10,
    );
    expect(after.activeCount).toBe(before.activeCount + 1);
    expect(after.neutralizedCount).toBe(before.neutralizedCount + 1);
  });

  it("keeps unreviewed submissions out of the totals and in pendingCount", async () => {
    const before = await readStats();

    const pending = await createSite({
      name: "Stats Test Pending",
      ...uniqueTestCoords(),
      approxCount: 500,
      moderation: "pending",
    });
    createdIds.push(pending.id);

    const after = await readStats();

    expect(after.totalSites).toBe(before.totalSites);
    expect(after.totalApproxDatacenters).toBe(before.totalApproxDatacenters);
    expect(after.pendingCount).toBe(before.pendingCount + 1);
  });

  it("excludes rejected sites entirely", async () => {
    const before = await readStats();

    const rejected = await createSite({
      name: "Stats Test Rejected",
      ...uniqueTestCoords(),
      approxCount: 900,
      moderation: "rejected",
    });
    createdIds.push(rejected.id);

    const after = await readStats();

    expect(after.totalSites).toBe(before.totalSites);
    expect(after.pendingCount).toBe(before.pendingCount);
  });
});
