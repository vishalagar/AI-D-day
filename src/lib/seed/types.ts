/**
 * A hand-curated reference site. These are inserted pre-approved and locked:
 * they are the sourced backbone that makes the map worth looking at on a
 * first visit, and they can't be voted off or edited.
 *
 * `approxCount` is the number of datacenter *buildings / halls* publicly
 * reported at the campus — deliberately approximate, matching the rest of
 * the app's framing. Operators rarely publish exact counts and the figure
 * changes constantly as new phases come online.
 */
export interface SeedSite {
  name: string;
  lat: number;
  lng: number;
  approxCount: number;
  operator: string;
  notes: string;
  sourceUrl: string;
}

/** Official operator location pages, referenced by many rows. */
export const SOURCES = {
  google: "https://www.google.com/about/datacenters/locations/",
  meta: "https://datacenters.atmeta.com/",
  microsoft: "https://datacenters.microsoft.com/globe/explore",
  aws: "https://aws.amazon.com/about-aws/global-infrastructure/regions_az/",
  oracle: "https://www.oracle.com/cloud/public-cloud-regions/",
  apple: "https://www.apple.com/environment/",
} as const;
