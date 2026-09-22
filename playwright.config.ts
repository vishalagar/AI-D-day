import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    // Gives e2e runs their own rate-limit bucket, distinct from the
    // "unknown" bucket shared by real requests with no X-Forwarded-For
    // header (e.g. local curl testing) — otherwise unrelated testing
    // exhausts the same window and e2e runs start seeing spurious 429s.
    extraHTTPHeaders: { "x-forwarded-for": "playwright-e2e" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
