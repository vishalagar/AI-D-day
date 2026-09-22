import { describe, expect, it } from "vitest";

import { getClientKey } from "../rate-limit";

describe("getClientKey", () => {
  it("extracts the first IP from x-forwarded-for", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });
    expect(getClientKey(request)).toBe("203.0.113.5");
  });

  it("trims whitespace around the IP", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  203.0.113.5  " },
    });
    expect(getClientKey(request)).toBe("203.0.113.5");
  });

  it("falls back to 'unknown' when the header is missing", () => {
    const request = new Request("https://example.com");
    expect(getClientKey(request)).toBe("unknown");
  });

  it("falls back to 'unknown' when the header is empty", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "" },
    });
    expect(getClientKey(request)).toBe("unknown");
  });
});
