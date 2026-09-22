import { createHash } from "node:crypto";

/** Header the client sends its browser-local, randomly generated voter token in. */
export const VOTER_HEADER = "x-voter-id";

/** localStorage key holding that same token on the client. */
export const VOTER_STORAGE_KEY = "ai-dday-voter";

const VOTER_TOKEN_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/;

function clientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();
  return ip && ip.length > 0 ? ip : "unknown";
}

/**
 * Derives the anonymous, stable identifier a vote is recorded against.
 *
 * Binding the browser token to the request IP means clearing localStorage
 * alone doesn't buy a second vote, and the hash means we never store either
 * the raw token or the IP. This is deliberately not airtight — someone with
 * a VPN can vote twice. Without accounts that's the accepted ceiling, and
 * it's documented as such on the Field Manual page.
 */
export function deriveVoterKey(request: Request): string {
  const raw = request.headers.get(VOTER_HEADER)?.trim() ?? "";
  const token = VOTER_TOKEN_PATTERN.test(raw) ? raw : "anonymous";
  const salt = process.env.VOTER_SALT ?? "ai-dday-local-dev-salt";

  return createHash("sha256")
    .update(`${salt}:${token}:${clientIp(request)}`)
    .digest("hex")
    .slice(0, 64);
}
