import { type APIRequestContext, expect, test } from "@playwright/test";

import { APPROVE_THRESHOLD } from "../src/lib/config/moderation";
import {
  OCEAN_POINTS,
  backToMap,
  closeReviewWindow,
  gotoMap,
  logSite,
  rateLimitBucket,
} from "./helpers";

test.use({ extraHTTPHeaders: rateLimitBucket("review-queue") });

/**
 * Casts ballots straight at the API as other people. A single browser can
 * only ever be one voter — token plus IP is the identity — so reaching a
 * threshold through the UI alone is impossible by design.
 */
async function voteAsOthers(
  request: APIRequestContext,
  siteId: string,
  value: 1 | -1,
  count: number,
) {
  for (let i = 0; i < count; i++) {
    const response = await request.post(`/api/sites/${siteId}/vote`, {
      headers: {
        "x-forwarded-for": `e2e-voter-${value}-${siteId}-${i}`,
        "x-voter-id": `e2e-token-${value}-${siteId}-${i}`,
      },
      data: { value },
    });
    expect(response.ok()).toBe(true);
  }
}

async function findPending(request: APIRequestContext, name: string) {
  const response = await request.get("/api/sites?moderation=pending");
  const body = (await response.json()) as {
    sites: { id: string; name: string }[];
  };
  const site = body.sites.find((candidate) => candidate.name === name);
  expect(site, `pending submission "${name}" should exist`).toBeTruthy();
  return site!;
}

test("confirming the last needed vote puts a site on the map", async ({
  page,
  request,
}) => {
  const siteName = `E2E Queue Site ${Date.now()}`;

  await gotoMap(page);
  await logSite(page, siteName, OCEAN_POINTS.c);
  await backToMap(page);

  const site = await findPending(request, siteName);
  await voteAsOthers(request, site.id, 1, APPROVE_THRESHOLD - 1);

  await page.goto("/queue");
  await expect(page.getByRole("heading", { name: siteName })).toBeVisible({
    timeout: 15_000,
  });

  // The split of opinion and the countdown, not a tally — the raw counts are
  // deliberately never rendered.
  await expect(page.getByText(/% confirm/)).toBeVisible();
  await expect(page.getByText(/Review closes in/)).toBeVisible();

  // Nothing reaches the map before its window closes, so promotion can only
  // be tested by running the clock out first.
  await closeReviewWindow(site.id);

  await page.getByRole("button", { name: "Confirm" }).click();

  // The verdict interrupts the deck only because the state actually changed.
  await expect(page.getByText("On the board")).toBeVisible();

  // Assert this site's own pin rather than a total count — the count is
  // shared state that other specs and leftover rows can shift underneath us.
  await gotoMap(page);
  await expect(
    page.locator(`.leaflet-marker-icon[title="${siteName}"]`),
  ).toBeVisible({ timeout: 15_000 });
});

test("a site past the threshold still waits out its review window", async ({
  page,
  request,
}) => {
  const siteName = `E2E Window Site ${Date.now()}`;

  // Submitted over the API with explicit coordinates rather than through the
  // map: this spec is about the clock, and picking a deep-South-Pacific point
  // by hand avoids competing with the other specs' click targets.
  const created = await request.post("/api/sites", {
    data: { name: siteName, lat: -45, lng: -140, approxCount: 1 },
  });
  expect(created.status()).toBe(201);

  const site = await findPending(request, siteName);
  await voteAsOthers(request, site.id, 1, APPROVE_THRESHOLD + 1);

  // Comfortably over the line, and still nowhere near the map.
  await gotoMap(page);
  await expect(
    page.locator(`.leaflet-marker-icon[title="${siteName}"]`),
  ).toHaveCount(0);
  expect(await findPending(request, siteName)).toBeTruthy();
});

test("disputing past the threshold discards a site", async ({
  page,
  request,
}) => {
  const siteName = `E2E Discard Site ${Date.now()}`;

  await gotoMap(page);
  await logSite(page, siteName, OCEAN_POINTS.d);
  await backToMap(page);

  const site = await findPending(request, siteName);
  await voteAsOthers(request, site.id, -1, 2);

  await page.goto("/queue");
  await expect(page.getByRole("heading", { name: siteName })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("button", { name: "Dispute" }).click();
  await expect(page.getByText("Discarded")).toBeVisible();
});
