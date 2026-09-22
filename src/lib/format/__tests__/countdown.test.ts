import { describe, expect, it } from "vitest";

import { formatTimeLeft } from "../countdown";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

describe("formatTimeLeft", () => {
  it("reports hours and minutes together", () => {
    expect(formatTimeLeft(13 * HOUR + 40 * MINUTE)).toBe("13h 40m");
  });

  it("drops the minutes when there aren't any", () => {
    expect(formatTimeLeft(5 * HOUR)).toBe("5h");
  });

  it("falls back to minutes inside the last hour", () => {
    expect(formatTimeLeft(42 * MINUTE)).toBe("42m");
  });

  it("collapses the last minute rather than counting seconds", () => {
    expect(formatTimeLeft(20_000)).toBe("under a minute");
  });

  it("reports a window that has run out as closed", () => {
    expect(formatTimeLeft(0)).toBe("closed");
    expect(formatTimeLeft(-5 * HOUR)).toBe("closed");
  });

  it("floors rather than rounding, so it never overstates the time left", () => {
    expect(formatTimeLeft(2 * HOUR - 1)).toBe("1h 59m");
  });
});
