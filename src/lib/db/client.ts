import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | undefined;

/**
 * Lazily constructs the DB client on first real use. Must not run at module
 * evaluation time — Next.js imports route modules during the build's
 * page-data collection step, before deployment env vars are available.
 */
export function getDb(): Db {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Run `vercel env pull` or set it in .env.local.",
    );
  }

  cached = drizzle(neon(url), { schema });
  return cached;
}
