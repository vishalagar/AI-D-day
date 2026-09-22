import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { createSite, getSiteById } from "@/lib/db/queries/sites";
import { deleteSiteForTest, uniqueTestCoords } from "@/test-utils/db";
import { jsonRequest } from "@/test-utils/request";

import { GET, PATCH } from "../route";

const createdIds: string[] = [];

afterEach(async () => {
  while (createdIds.length > 0) {
    const id = createdIds.pop();
    if (id) await deleteSiteForTest(id).catch(() => undefined);
  }
});

async function makeSite(overrides: Record<string, unknown> = {}) {
  const site = await createSite({
    name: "Detail Route Test Site",
    ...uniqueTestCoords(),
    approxCount: 2,
    moderation: "approved",
    upvotes: 4,
    ...overrides,
  });
  createdIds.push(site.id);
  return site;
}

function patch(id: string, body: Record<string, unknown>) {
  return PATCH(
    jsonRequest(`http://localhost/api/sites/${id}`, "PATCH", body),
    { params: Promise.resolve({ id }) },
  );
}

describe("PATCH /api/sites/[id]", () => {
  it("flips status without sending the site back to review", async () => {
    const site = await makeSite();
    const response = await patch(site.id, { status: "neutralized" });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      site: { status: string; moderation: string; upvotes: number };
      returnedToReview: boolean;
    };
    expect(body.site.status).toBe("neutralized");
    expect(body.site.moderation).toBe("approved");
    expect(body.site.upvotes).toBe(4);
    expect(body.returnedToReview).toBe(false);
  });

  it("sends an approved site back to review when the claim changes", async () => {
    const site = await makeSite();
    const response = await patch(site.id, { approxCount: 99 });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      site: { moderation: string; upvotes: number; downvotes: number };
      returnedToReview: boolean;
    };
    expect(body.returnedToReview).toBe(true);
    expect(body.site.moderation).toBe("pending");
    expect(body.site.upvotes).toBe(0);
    expect(body.site.downvotes).toBe(0);
  });

  it("refuses to edit a locked reference site with 403", async () => {
    const site = await makeSite({ locked: true });
    const response = await patch(site.id, { name: "Vandalized" });

    expect(response.status).toBe(403);
    const stored = await getSiteById(site.id);
    expect(stored?.name).toBe("Detail Route Test Site");
  });

  it("still allows flipping a locked site's status", async () => {
    const site = await makeSite({ locked: true });
    const response = await patch(site.id, { status: "neutralized" });
    expect(response.status).toBe(200);
  });

  it("rejects a non-http source URL with 400", async () => {
    const site = await makeSite();
    const response = await patch(site.id, { sourceUrl: "javascript:alert(1)" });
    expect(response.status).toBe(400);
  });

  it("returns 404 for a non-existent site", async () => {
    const id = randomUUID();
    const response = await patch(id, { status: "neutralized" });
    expect(response.status).toBe(404);
  });

  it("returns 400 for a malformed id", async () => {
    const response = await PATCH(
      jsonRequest("http://localhost/api/sites/not-a-uuid", "PATCH", {
        status: "active",
      }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 for an empty update payload", async () => {
    const site = await makeSite();
    const response = await patch(site.id, {});
    expect(response.status).toBe(400);
  });
});

describe("GET /api/sites/[id]", () => {
  it("returns a single site", async () => {
    const site = await makeSite();
    const response = await GET(
      new Request(`http://localhost/api/sites/${site.id}`),
      { params: Promise.resolve({ id: site.id }) },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { site: { id: string } };
    expect(body.site.id).toBe(site.id);
  });

  it("returns 404 for a non-existent site", async () => {
    const id = randomUUID();
    const response = await GET(new Request(`http://localhost/api/sites/${id}`), {
      params: Promise.resolve({ id }),
    });
    expect(response.status).toBe(404);
  });
});
