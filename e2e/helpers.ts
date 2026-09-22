import { randomUUID } from "node:crypto";

import { neon } from "@neondatabase/serverless";
import { expect, type Page } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

/**
 * Backdates a submission's mandatory review window.
 *
 * Promotion is gated on the window having closed, so without this every
 * promotion spec would have to wait 24 hours. Raw SQL rather than the app's
 * Drizzle client, matching global-setup — and there is deliberately no HTTP
 * route that can do this, because it would be a way to skip review.
 */
export async function closeReviewWindow(siteId: string): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set for e2e.");
  const sql = neon(url);
  await sql`UPDATE sites SET voting_ends_at = now() - interval '1 minute' WHERE id = ${siteId}`;
}

/**
 * A rate-limit bucket unique to this file *and* this run. Creates are capped
 * at 5 per 10 minutes per client, so a fixed key makes a second run inside
 * that window fail with 429s that look like product bugs.
 */
export function rateLimitBucket(label: string): Record<string, string> {
  return { "x-forwarded-for": `e2e-${label}-${randomUUID()}` };
}

/**
 * Click points, in map-container pixels, that land in open South Pacific at
 * the default view. Three constraints, all learned the hard way:
 *   - clear of the 83 seeded sites (the API refuses anything within ~5km)
 *   - far enough apart not to collide with each other
 *   - on the right-hand side, because the legend and the add-mode hint sit
 *     bottom-left and intercept pointer events there
 */
export const OCEAN_POINTS = {
  a: { x: 1150, y: 430 },
  b: { x: 1200, y: 470 },
  c: { x: 1150, y: 520 },
  d: { x: 1220, y: 560 },
} as const;

/** Waits out the dynamic import of the Leaflet map before interacting. */
export async function gotoMap(page: Page) {
  // Marks this browser as already welcomed. The intro card covers the map on
  // a first visit, so without this every spec would open on the overlay and
  // its clicks would land on the scrim.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("ai-dday-welcomed", "1");
    } catch {
      // Storage blocked in this context; the spec will fail visibly instead.
    }
  });
  await page.goto("/");
  await expect(page.getByText("Loading the map...")).toHaveCount(0, {
    timeout: 15_000,
  });
  await expect(page.locator(".leaflet-container")).toBeVisible();
  // Markers render a tick after the container. The seeded reference set
  // guarantees at least one, so waiting here stops callers from measuring a
  // baseline of zero and comparing it against a fully-drawn map later.
  await expect(page.locator(".leaflet-marker-icon").first()).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Drops a pin at the given map pixel and submits the form. Asserts the
 * success dialog, so a 409 or 429 fails here with a readable message instead
 * of surfacing as a confusing assertion three lines later.
 */
export async function logSite(
  page: Page,
  name: string,
  position: { x: number; y: number },
) {
  await page.getByRole("button", { name: "Log a site" }).click();
  await page.locator(".leaflet-container").click({ position });

  const dialog = page.getByRole("dialog", { name: "Log a site" });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder("Ashburn — Data Center Alley").fill(name);
  await dialog.getByRole("button", { name: "Submit for review" }).click();

  await expect(
    page.getByRole("dialog", { name: "Submitted for review" }),
  ).toBeVisible({ timeout: 10_000 });
}

/** Dismisses the post-submission dialog and returns to the map. */
export async function backToMap(page: Page) {
  await page
    .getByRole("dialog", { name: "Submitted for review" })
    .getByRole("button", { name: "Back to the map" })
    .click();
}
