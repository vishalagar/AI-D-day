/**
 * Absolute origin for link previews. X and friends need fully-qualified image
 * URLs, so this can't be relative. Prefers an explicit override, then the
 * production domain Vercel injects, then local dev.
 */
export function siteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
