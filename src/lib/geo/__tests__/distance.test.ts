import { describe, expect, it } from "vitest";

import { distanceKm, nearestSite } from "../distance";

const ashburn = { id: "a", name: "Ashburn", lat: 39.04, lng: -77.49, status: "active" as const };
const dublin = { id: "d", name: "Dublin", lat: 53.35, lng: -6.26, status: "active" as const };
const reston = { id: "r", name: "Reston", lat: 38.96, lng: -77.36, status: "active" as const };
const handled = { id: "h", name: "Handled", lat: 39.05, lng: -77.5, status: "neutralized" as const };

describe("distanceKm", () => {
  it("is zero for the same point", () => {
    expect(distanceKm({ lat: 10, lng: 10 }, { lat: 10, lng: 10 })).toBe(0);
  });

  it("matches a known great-circle distance (London to Paris ~344 km)", () => {
    const km = distanceKm({ lat: 51.5074, lng: -0.1278 }, { lat: 48.8566, lng: 2.3522 });
    expect(km).toBeGreaterThan(340);
    expect(km).toBeLessThan(348);
  });

  it("takes the short way across the antimeridian", () => {
    const km = distanceKm({ lat: 0, lng: 179.5 }, { lat: 0, lng: -179.5 });
    expect(km).toBeLessThan(120);
  });
});

describe("nearestSite", () => {
  it("returns null when there is nothing still humming", () => {
    expect(nearestSite({ lat: 0, lng: 0 }, [handled])).toBeNull();
  });

  it("finds the closest active site and counts neighbours within the radius", () => {
    const washington = { lat: 38.9, lng: -77.03 };
    const result = nearestSite(washington, [dublin, reston, handled]);
    expect(result?.site.id).toBe("r");
    expect(result?.km).toBeGreaterThan(20);
    expect(result?.km).toBeLessThan(40);
    expect(nearestSite(washington, [ashburn, reston, dublin])?.nearbyCount).toBe(1);
  });

  it("ignores handled sites", () => {
    const result = nearestSite({ lat: 39.05, lng: -77.5 }, [handled, dublin]);
    expect(result?.site.id).toBe("d");
  });
});
