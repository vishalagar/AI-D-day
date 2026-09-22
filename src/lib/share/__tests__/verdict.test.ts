import { describe, expect, it } from "vitest";

import { VERDICTS, verdictFor } from "../verdict";

describe("verdictFor", () => {
  it("puts a doorstep distance in the closest tier", () => {
    expect(verdictFor(0).id).toBe(VERDICTS[0].id);
  });

  it("puts a huge distance in the farthest tier", () => {
    expect(verdictFor(19_000).id).toBe(VERDICTS[VERDICTS.length - 1].id);
  });

  it("treats each tier's limit as exclusive", () => {
    const first = VERDICTS[0];
    expect(verdictFor(first.underKm - 0.01).id).toBe(first.id);
    expect(verdictFor(first.underKm).id).toBe(VERDICTS[1].id);
  });

  it("orders tiers by distance", () => {
    const limits = VERDICTS.map((verdict) => verdict.underKm);
    expect([...limits].sort((a, b) => a - b)).toEqual(limits);
  });
});
