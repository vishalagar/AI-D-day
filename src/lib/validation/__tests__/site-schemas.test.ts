import { describe, expect, it } from "vitest";

import {
  createSiteSchema,
  siteIdSchema,
  updateSiteSchema,
} from "../site-schemas";

const validCreate = {
  name: "Ashburn Site B",
  lat: 39.0438,
  lng: -77.4874,
  approxCount: 12,
  operator: "Acme Cloud",
  notes: "Ring of cooling towers visible from the highway.",
};

describe("createSiteSchema", () => {
  it("accepts a fully valid payload", () => {
    expect(createSiteSchema.safeParse(validCreate).success).toBe(true);
  });

  it("accepts a minimal payload without optional fields", () => {
    const { operator, notes, ...minimal } = validCreate;
    void operator;
    void notes;
    expect(createSiteSchema.safeParse(minimal).success).toBe(true);
  });

  it.each([-90.0001, 90.0001])("rejects out-of-range lat %s", (lat) => {
    const result = createSiteSchema.safeParse({ ...validCreate, lat });
    expect(result.success).toBe(false);
  });

  it.each([-180.0001, 180.0001])("rejects out-of-range lng %s", (lng) => {
    const result = createSiteSchema.safeParse({ ...validCreate, lng });
    expect(result.success).toBe(false);
  });

  it("rejects a zero approxCount", () => {
    const result = createSiteSchema.safeParse({
      ...validCreate,
      approxCount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative approxCount", () => {
    const result = createSiteSchema.safeParse({
      ...validCreate,
      approxCount: -5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer approxCount", () => {
    const result = createSiteSchema.safeParse({
      ...validCreate,
      approxCount: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects approxCount over the max", () => {
    const result = createSiteSchema.safeParse({
      ...validCreate,
      approxCount: 100001,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = createSiteSchema.safeParse({ ...validCreate, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a name over 120 characters", () => {
    const result = createSiteSchema.safeParse({
      ...validCreate,
      name: "a".repeat(121),
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes over 1000 characters", () => {
    const result = createSiteSchema.safeParse({
      ...validCreate,
      notes: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a payload missing required fields", () => {
    const result = createSiteSchema.safeParse({ name: "Missing coords" });
    expect(result.success).toBe(false);
  });

  it("does not reject script-like content at the schema layer (sanitize handles it)", () => {
    const result = createSiteSchema.safeParse({
      ...validCreate,
      notes: "<script>alert(1)</script>",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateSiteSchema", () => {
  it("accepts a partial update with one field", () => {
    expect(updateSiteSchema.safeParse({ status: "neutralized" }).success).toBe(
      true,
    );
  });

  it("rejects an empty update payload", () => {
    expect(updateSiteSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an invalid status value", () => {
    const result = updateSiteSchema.safeParse({ status: "destroyed" });
    expect(result.success).toBe(false);
  });
});

describe("siteIdSchema", () => {
  it("accepts a valid UUID", () => {
    expect(
      siteIdSchema.safeParse("123e4567-e89b-12d3-a456-426614174000").success,
    ).toBe(true);
  });

  it("rejects a non-UUID string", () => {
    expect(siteIdSchema.safeParse("not-a-uuid").success).toBe(false);
  });
});
