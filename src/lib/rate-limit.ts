import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | undefined;

function getSharedRedis(): Redis {
  if (redis) return redis;

  // Vercel's Upstash-for-Redis marketplace integration provisions these
  // under the KV_REST_API_* names (not UPSTASH_REDIS_REST_*).
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      "KV_REST_API_URL / KV_REST_API_TOKEN are not set. Run `vercel env pull` or set them in .env.local.",
    );
  }

  redis = new Redis({ url, token });
  return redis;
}

let limiters:
  | {
      create: Ratelimit;
      update: Ratelimit;
      vote: Ratelimit;
    }
  | undefined;

/**
 * Lazily constructs the rate limiters on first real use. Must not run at
 * module evaluation time — Next.js imports route modules during the
 * build's page-data collection step, before deployment env vars exist.
 */
function getLimiters() {
  if (limiters) return limiters;

  const client = getSharedRedis();
  limiters = {
    create: new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "ratelimit:sites:create",
    }),
    update: new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(10, "10 m"),
      prefix: "ratelimit:sites:update",
    }),
    // Voting is the main thing we *want* people doing, and a reviewer
    // clearing the queue in one sitting is a good actor, not an attacker —
    // so this ceiling is far higher than the write limits. Ballot stuffing
    // is handled by the per-voter unique index, not by throttling.
    vote: new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(60, "10 m"),
      prefix: "ratelimit:sites:vote",
    }),
  };
  return limiters;
}

export function limitCreateSite(key: string) {
  return getLimiters().create.limit(key);
}

export function limitUpdateSite(key: string) {
  return getLimiters().update.limit(key);
}

export function limitVote(key: string) {
  return getLimiters().vote.limit(key);
}

/** Falls back to a shared bucket key when no forwarded-for header is present. */
export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  return ip && ip.length > 0 ? ip : "unknown";
}
