import { expect, test } from "@playwright/test";

import { gotoMap } from "./helpers";

/** Central Washington DC — Ashburn's seeded campus is the nearest site. */
const WASHINGTON = { latitude: 38.9072, longitude: -77.0369 };

test.use({ geolocation: WASHINGTON, permissions: ["geolocation"] });

test("measuring the nearest AI produces a shareable result", async ({ page }) => {
  await gotoMap(page);
  await page.getByRole("button", { name: "How close is the nearest AI?" }).click();

  const card = page.getByRole("region", { name: "How close the nearest AI is" });
  await expect(card).toBeVisible({ timeout: 10_000 });
  await expect(card.getByText(/^\d+ km$/)).toBeVisible();
  await expect(card.getByLabel(/^Verdict: /)).toBeVisible();

  const post = card.getByRole("link", { name: "Post it on X" });
  const intent = new URL((await post.getAttribute("href")) ?? "");
  expect(intent.hostname).toBe("x.com");
  const shared = new URL(intent.searchParams.get("url") ?? "");
  // The link carries a distance, never the visitor's coordinates.
  expect([...shared.searchParams.keys()].sort()).toEqual(["km", "n", "site"]);
  expect(shared.href).not.toContain(String(WASHINGTON.latitude));

  await page.goto(shared.pathname + shared.search);
  await expect(page.getByText("from them.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Check mine" })).toBeVisible();
});

test("a phone-sized result card fits without horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await gotoMap(page);
  await page.getByRole("button", { name: "How close is the nearest AI?" }).click();
  await expect(page.getByRole("region", { name: "How close the nearest AI is" })).toBeVisible({
    timeout: 10_000,
  });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
  await page.screenshot({ path: "test-results/proximity-mobile.png" });
});

test("a tampered share link falls back instead of erroring", async ({ page }) => {
  const response = await page.goto("/r?km=12&site=not-a-site&n=0");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("Somebody sent you a broken link.")).toBeVisible();
});
