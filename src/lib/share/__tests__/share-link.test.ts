import { describe, expect, it } from "vitest";

import { buildResultPath, buildTweetUrl, parseResultParams } from "../share-link";

const SITE_ID = "3f2b8c1e-8a4d-4b7e-9c1a-2d3e4f5a6b7c";

describe("buildResultPath", () => {
  it("rounds the distance and carries only km, site and count", () => {
    expect(buildResultPath({ km: 23.7, siteId: SITE_ID, nearbyCount: 4 })).toBe(
      `/r?km=24&site=${SITE_ID}&n=4`,
    );
  });
});

describe("parseResultParams", () => {
  it("round-trips a built path", () => {
    const query = new URLSearchParams(
      buildResultPath({ km: 12, siteId: SITE_ID, nearbyCount: 2 }).split("?")[1],
    );
    expect(parseResultParams(Object.fromEntries(query))).toEqual({
      km: 12,
      siteId: SITE_ID,
      nearbyCount: 2,
    });
  });

  it("rejects a site that isn't a uuid", () => {
    expect(parseResultParams({ km: "5", site: "<script>", n: "0" })).toBeNull();
  });

  it("rejects distances off the planet", () => {
    expect(parseResultParams({ km: "-3", site: SITE_ID, n: "0" })).toBeNull();
    expect(parseResultParams({ km: "90000", site: SITE_ID, n: "0" })).toBeNull();
  });

  it("rejects repeated params", () => {
    expect(parseResultParams({ km: ["1", "2"], site: SITE_ID, n: "0" })).toBeNull();
  });
});

describe("buildTweetUrl", () => {
  it("builds an X intent with the text and link encoded", () => {
    const url = new URL(buildTweetUrl("Hi & bye", "https://example.com/r?km=1"));
    expect(url.origin).toBe("https://x.com");
    expect(url.searchParams.get("text")).toBe("Hi & bye");
    expect(url.searchParams.get("url")).toBe("https://example.com/r?km=1");
  });
});
