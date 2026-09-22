import { expect, test } from "@playwright/test";

import { OCEAN_POINTS, backToMap, gotoMap, logSite, rateLimitBucket } from "./helpers";

test.use({ extraHTTPHeaders: rateLimitBucket("add-site") });

test("a submitted site goes to the review queue, not straight to the map", async ({
  page,
}) => {
  const siteName = `E2E Add Site ${Date.now()}`;

  await gotoMap(page);

  // logSite asserts the confirmation dialog, which names the queue as the
  // next step rather than claiming the site is live.
  await logSite(page, siteName, OCEAN_POINTS.a);
  await backToMap(page);

  // It is pending, so it gets no pin of its own. Checking for this site's
  // marker specifically rather than a total count, which other specs and
  // leftover rows can shift underneath us.
  await expect(
    page.locator(`.leaflet-marker-icon[title="${siteName}"]`),
  ).toHaveCount(0);

  // ...but the queue counter picks it up.
  await expect(
    page.getByRole("link", { name: /need a second opinion/ }),
  ).toBeVisible({ timeout: 10_000 });
});

test("a second site at the same spot is refused as a duplicate", async ({
  page,
}) => {
  const siteName = `E2E Duplicate ${Date.now()}`;

  await gotoMap(page);
  await logSite(page, siteName, OCEAN_POINTS.b);
  await backToMap(page);

  await page.getByRole("button", { name: "Log a site" }).click();
  await page.locator(".leaflet-container").click({ position: OCEAN_POINTS.b });

  const dialog = page.getByRole("dialog", { name: "Log a site" });
  await dialog
    .getByPlaceholder("Ashburn — Data Center Alley")
    .fill(`${siteName} again`);
  await dialog.getByRole("button", { name: "Submit for review" }).click();

  await expect(page.getByText(/already logged within/i)).toBeVisible();
});
