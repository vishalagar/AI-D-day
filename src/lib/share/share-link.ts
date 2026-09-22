import { z } from "zod";

/** Half the planet's circumference, rounded up. Nothing on Earth is further. */
const MAX_KM = 20_050;
const MAX_NEARBY = 10_000;

export interface ProximityResult {
  km: number;
  siteId: string;
  nearbyCount: number;
}

type RawParams = Record<string, string | string[] | undefined>;

const resultParamsSchema = z.object({
  km: z.coerce.number().int().min(0).max(MAX_KM),
  site: z.uuid(),
  n: z.coerce.number().int().min(0).max(MAX_NEARBY),
});

/**
 * The share link carries only the rounded distance, the public site's id and
 * a count — never the visitor's coordinates. The site's name is looked up
 * server-side from the id, so nobody can put arbitrary text into a preview
 * image served from this domain.
 */
export function buildResultPath({ km, siteId, nearbyCount }: ProximityResult): string {
  const query = new URLSearchParams({
    km: String(Math.round(km)),
    site: siteId,
    n: String(nearbyCount),
  });
  return `/r?${query.toString()}`;
}

export function parseResultParams(raw: RawParams): ProximityResult | null {
  const parsed = resultParamsSchema.safeParse(raw);
  if (!parsed.success) return null;
  return { km: parsed.data.km, siteId: parsed.data.site, nearbyCount: parsed.data.n };
}

export function buildTweetUrl(text: string, link: string): string {
  const query = new URLSearchParams({ text, url: link });
  return `https://x.com/intent/post?${query.toString()}`;
}
