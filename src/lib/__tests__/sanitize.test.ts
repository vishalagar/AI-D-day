import { describe, expect, it } from "vitest";

import { sanitizeOptional, stripHtml } from "../sanitize";

describe("stripHtml", () => {
  it("removes angle brackets", () => {
    expect(stripHtml("<script>alert(1)</script>")).toBe(
      "scriptalert(1)/script",
    );
  });

  it("leaves plain text untouched", () => {
    expect(stripHtml("Ashburn Site B, 12 buildings")).toBe(
      "Ashburn Site B, 12 buildings",
    );
  });
});

describe("sanitizeOptional", () => {
  it("returns undefined for undefined input", () => {
    expect(sanitizeOptional(undefined)).toBeUndefined();
  });

  it("trims and strips html from a string", () => {
    expect(sanitizeOptional("  <b>Acme</b>  ")).toBe("bAcme/b");
  });

  it("returns undefined when the cleaned result is empty", () => {
    expect(sanitizeOptional("   ")).toBeUndefined();
  });
});
