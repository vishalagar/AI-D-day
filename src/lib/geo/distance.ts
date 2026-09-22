const EARTH_RADIUS_KM = 6371;

/** Radius used for "N more within reach" on the proximity result. */
export const NEARBY_RADIUS_KM = 250;

export interface Point {
  lat: number;
  lng: number;
}

interface LocatableSite extends Point {
  id: string;
  name: string;
  status: "active" | "neutralized";
}

export interface NearestResult<T extends LocatableSite> {
  site: T;
  km: number;
  /** Other still-humming sites within NEARBY_RADIUS_KM, excluding `site`. */
  nearbyCount: number;
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle (haversine) distance. Handles the antimeridian on its own. */
export function distanceKm(from: Point, to: Point): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * The closest site still humming. Handled sites don't count — the joke is
 * how close the *running* ones are.
 */
export function nearestSite<T extends LocatableSite>(
  from: Point,
  sites: readonly T[],
): NearestResult<T> | null {
  const measured = sites
    .filter((site) => site.status === "active")
    .map((site) => ({ site, km: distanceKm(from, site) }))
    .sort((a, b) => a.km - b.km);

  if (measured.length === 0) return null;

  const [closest, ...rest] = measured;
  return {
    site: closest.site,
    km: closest.km,
    nearbyCount: rest.filter((entry) => entry.km < NEARBY_RADIUS_KM).length,
  };
}
