import { afterEach, describe, expect, it } from "vitest";

import { deleteSiteForTest, uniqueTestCoords } from "@/test-utils/db";
import { jsonRequest, uniqueTestIp } from "@/test-utils/request";

import { GET, POST } from "../route";

function payload(overrides: Record<string, unknown> = {}) {
  return {
    name: "Integration Test Site",
    ...uniqueTestCoords(),
    approxCount: 3,
    ...overrides,
  };
}

const createdIds: string[] = [];

afterEach(async () => {
  while (createdIds.length > 0) {
    const id = createdIds.pop();
    if (id) await deleteSiteForTest(id);
  }
});

async function createdId(response: Response): Promise<string> {
  const body = (await response.json()) as { site: { id: string } };
  createdIds.push(body.site.id);
  return body.site.id;
}

describe("GET /api/sites", () => {
  it("returns the sites list shape", async () => {
    const response = await GET(new Request("http://localhost/api/sites"));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      sites: unknown[];
      myVotes: Record<string, number>;
    };
    expect(Array.isArray(body.sites)).toBe(true);
    expect(body.myVotes).toBeTypeOf("object");
  });

  it("only returns approved sites by default", async () => {
    const created = await POST(
      jsonRequest("http://localhost/api/sites", "POST", payload()),
    );
    const id = await createdId(created);

    const response = await GET(new Request("http://localhost/api/sites"));
    const body = (await response.json()) as { sites: { id: string }[] };
    expect(body.sites.some((site) => site.id === id)).toBe(false);
  });

  it("returns the new submission under the pending filter", async () => {
    const created = await POST(
      jsonRequest("http://localhost/api/sites", "POST", payload()),
    );
    const id = await createdId(created);

    const response = await GET(
      new Request("http://localhost/api/sites?moderation=pending"),
    );
    const body = (await response.json()) as { sites: { id: string }[] };
    expect(body.sites.some((site) => site.id === id)).toBe(true);
  });

  it("rejects an unknown moderation filter with 400", async () => {
    const response = await GET(
      new Request("http://localhost/api/sites?moderation=everything"),
    );
    expect(response.status).toBe(400);
  });
});

describe("POST /api/sites", () => {
  it("creates a site as pending and returns 201", async () => {
    const data = payload();
    const response = await POST(
      jsonRequest("http://localhost/api/sites", "POST", data),
    );
    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      site: { id: string; name: string; moderation: string; upvotes: number };
    };
    expect(body.site.name).toBe(data.name);
    expect(body.site.moderation).toBe("pending");
    expect(body.site.upvotes).toBe(0);
    createdIds.push(body.site.id);
  });

  it("strips angle brackets from name and notes", async () => {
    const response = await POST(
      jsonRequest(
        "http://localhost/api/sites",
        "POST",
        payload({
          name: "<b>Injected</b> Site",
          notes: "<script>alert(1)</script>",
        }),
      ),
    );
    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      site: { id: string; name: string; notes: string | null };
    };
    expect(body.site.name).not.toContain("<");
    expect(body.site.notes).not.toContain("<");
    createdIds.push(body.site.id);
  });

  it("rejects a second site at the same coordinates with 409", async () => {
    const data = payload();
    const first = await POST(
      jsonRequest("http://localhost/api/sites", "POST", data),
    );
    await createdId(first);

    const second = await POST(
      jsonRequest("http://localhost/api/sites", "POST", {
        ...data,
        name: "Duplicate Of The Above",
      }),
    );
    expect(second.status).toBe(409);
    const body = (await second.json()) as { existingSite: { name: string } };
    expect(body.existingSite.name).toBe(data.name);
  });

  it("rejects a non-http source URL with 400", async () => {
    const response = await POST(
      jsonRequest(
        "http://localhost/api/sites",
        "POST",
        payload({ sourceUrl: "javascript:alert(1)" }),
      ),
    );
    expect(response.status).toBe(400);
  });

  it("rejects an invalid payload with 400", async () => {
    const response = await POST(
      jsonRequest("http://localhost/api/sites", "POST", payload({ lat: 999 })),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBeTruthy();
  });

  it("rejects malformed JSON with 400", async () => {
    const request = new Request("http://localhost/api/sites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": uniqueTestIp(),
      },
      body: "{not json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rate limits after 5 creates from the same client in one window", async () => {
    const ip = uniqueTestIp();
    const responses: Response[] = [];
    for (let i = 0; i < 6; i++) {
      responses.push(
        await POST(
          jsonRequest(
            "http://localhost/api/sites",
            "POST",
            payload({ name: `Rate Limit Test ${i}` }),
            ip,
          ),
        ),
      );
    }

    for (const response of responses.slice(0, 5)) {
      expect(response.status).toBe(201);
      await createdId(response);
    }
    expect(responses[5].status).toBe(429);
  });
});
