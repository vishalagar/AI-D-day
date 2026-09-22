import { config as loadEnv } from "dotenv";

import "@testing-library/jest-dom/vitest";

// Integration tests hit the real dev Neon DB / Upstash Redis provisioned via
// Vercel Marketplace — load the same credentials `next dev` uses.
loadEnv({ path: ".env.local" });

// Fallback dummies so modules that eagerly construct Upstash/Neon clients at
// import time don't throw during pure-unit-test collection when no
// .env.local is present (e.g. a fresh checkout without infra set up yet).
process.env.KV_REST_API_URL ??= "https://example-test.upstash.io";
process.env.KV_REST_API_TOKEN ??= "test-token";
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
