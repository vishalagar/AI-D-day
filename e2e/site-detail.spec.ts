import { expect, type Page } from "@playwright/test";
import { test } from "@playwright/test";

import { gotoMap } from "./helpers";

/**
 * Nairobi, not `.first()`: at world zoom many seeded campuses overlap (the
 * Pacific Northwest cluster especially), and a neighbouring marker
 * intercepts the click. This one has no seeded site within ~25 degrees.
 */
const ISOLATED_SITE = "Nairobi";

async function openIsolatedSite(page: Page) {
  await gotoMap(page);
  await page.locator(`.leaflet-marker-icon[title="${ISOLATED_SITE}"]`).click();
  const detail = page.getByRole("dialog", { name: ISOLATED_SITE });
  await expect(detail).toBeVisible();
  return detail;
}

test("a seeded reference site can be taken offline but not edited", async ({
  page,
}) => {
  const detail = await openIsolatedSite(page);

  // Exact match: the phrase also appears in two explanatory paragraphs, and
  // a substring match resolves to three elements.
  await expect(
    detail.getByText("Sourced reference", { exact: true }),
  ).toBeVisible();
  await expect(detail.getByText("Still humming", { exact: true })).toBeVisible();

  // Locked entries expose no edit affordance at all.
  await expect(
    detail.getByRole("button", { name: "Edit details" }),
  ).toHaveCount(0);

  await detail.getByRole("button", { name: "Mark handled" }).click();
  await expect(detail.getByText("Handled", { exact: true })).toBeVisible();

  // Restore, so the spec leaves the shared seeded row as it found it.
  await detail.getByRole("button", { name: "Mark still humming" }).click();
  await expect(detail.getByText("Still humming", { exact: true })).toBeVisible();
});

test("votes on a locked site are recorded but can't remove it", async ({
  page,
}) => {
  const detail = await openIsolatedSite(page);

  await expect(
    detail.getByText(/Votes are recorded but it stays on the map/),
  ).toBeVisible();
});

test("there is no way to delete a site", async ({ page }) => {
  const detail = await openIsolatedSite(page);

  await expect(detail.getByRole("button", { name: /delete/i })).toHaveCount(0);
});
