import { randomUUID } from "node:crypto";

import { afterEach, describe, expect, it } from "vitest";

import { APPROVE_THRESHOLD, REJECT_THRESHOLD } from "@/lib/config/moderation";
import { settleDueSites } from "@/lib/db/queries/settle";
import { createSite, getSiteById } from "@/lib/db/queries/sites";
import { VOTER_HEADER } from "@/lib/voter";
import {
  closeVotingWindowForTest as closeWindow,
  deleteSiteForTest,
  uniqueTestCoords,
} from "@/test-utils/db";
import { uniqueTestIp } from "@/test-utils/request";

import { POST } from "../route";

const createdIds: string[] = [];

afterEach(async () => {
  while (createdIds.length > 0) {
    const id = createdIds.pop();
    if (id) await deleteSiteForTest(id).catch(() => undefined);
  }
});

async function makeSite(overrides: Record<string, unknown> = {}) {
  const site = await createSite({
    name: "Vote Route Test Site",
    ...uniqueTestCoords(),
    approxCount: 2,
    ...overrides,
  });
  createdIds.push(site.id);
  return site;
}

/**
 * A submission whose mandatory review window has already run out. Tests that
 * care about promotion need this — a freshly created site can't be promoted
 * for another 24 hours no matter how it's voted on.
 */
const CLOSED_WINDOW = { votingEndsAt: new Date(Date.now() - 60_000) };

interface VoteBody {
  site: { moderation: string; upvotes: number; downvotes: number };
  promoted: boolean;
  rejected: boolean;
  error?: string;
}

/**
 * A voter's identity is the browser token *and* the request IP, so reusing a
 * token has to reuse its IP too — otherwise the same person looks like two.
 * Omitting `voter` therefore gives a genuinely distinct voter each call.
 */
const ipForVoter = new Map<string, string>();

function castVote(siteId: string, value: number, voter = randomUUID()) {
  let ip = ipForVoter.get(voter);
  if (!ip) {
    ip = uniqueTestIp();
    ipForVoter.set(voter, ip);
  }

  return POST(
    new Request(`http://localhost/api/sites/${siteId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": ip,
        [VOTER_HEADER]: voter,
      },
      body: JSON.stringify({ value }),
    }),
    { params: Promise.resolve({ id: siteId }) },
  );
}

describe("POST /api/sites/[id]/vote", () => {
  it("records an upvote and leaves the site pending below the threshold", async () => {
    const site = await makeSite();
    const response = await castVote(site.id, 1);

    expect(response.status).toBe(200);
    const body = (await response.json()) as VoteBody;
    expect(body.site.upvotes).toBe(1);
    expect(body.site.moderation).toBe("pending");
    expect(body.promoted).toBe(false);
  });

  it("promotes a site that reaches the threshold after its review window closed", async () => {
    const site = await makeSite(CLOSED_WINDOW);

    let body: VoteBody | undefined;
    for (let i = 0; i < APPROVE_THRESHOLD; i++) {
      body = (await (await castVote(site.id, 1)).json()) as VoteBody;
    }

    expect(body?.site.upvotes).toBe(APPROVE_THRESHOLD);
    expect(body?.site.moderation).toBe("approved");
    expect(body?.promoted).toBe(true);
  });

  it("holds a site at pending while its review window is still open", async () => {
    const site = await makeSite();

    let body: VoteBody | undefined;
    for (let i = 0; i < APPROVE_THRESHOLD + 2; i++) {
      body = (await (await castVote(site.id, 1)).json()) as VoteBody;
    }

    expect(body?.site.upvotes).toBe(APPROVE_THRESHOLD + 2);
    expect(body?.site.moderation).toBe("pending");
    expect(body?.promoted).toBe(false);
  });

  it("discards a site during its window — rejection isn't held back", async () => {
    const site = await makeSite();

    let body: VoteBody | undefined;
    for (let i = 0; i < Math.abs(REJECT_THRESHOLD); i++) {
      body = (await (await castVote(site.id, -1)).json()) as VoteBody;
    }

    expect(body?.site.moderation).toBe("rejected");
    expect(body?.rejected).toBe(true);
  });

  it("settles a site whose window ran out while it was already over the line", async () => {
    const site = await makeSite();

    // Over the threshold, but promotion is blocked while the window is open.
    for (let i = 0; i < APPROVE_THRESHOLD; i++) await castVote(site.id, 1);
    expect((await getSiteById(site.id))?.moderation).toBe("pending");

    // The window closes and nobody votes again — without the settle pass the
    // entry would sit pending forever, since nothing else re-evaluates it.
    await closeWindow(site.id);
    await settleDueSites();

    expect((await getSiteById(site.id))?.moderation).toBe("approved");
  });

  it("leaves a closed window alone when the tally never got there", async () => {
    const site = await makeSite();

    await castVote(site.id, 1);
    await closeWindow(site.id);
    await settleDueSites();

    expect((await getSiteById(site.id))?.moderation).toBe("pending");
  });

  it("counts one ballot per voter, not one per request", async () => {
    const site = await makeSite();
    const voter = randomUUID();

    await castVote(site.id, 1, voter);
    await castVote(site.id, 1, voter);
    const body = (await (await castVote(site.id, 1, voter)).json()) as VoteBody;

    expect(body.site.upvotes).toBe(1);
    expect(body.site.moderation).toBe("pending");
  });

  it("lets a voter switch their vote", async () => {
    const site = await makeSite();
    const voter = randomUUID();

    await castVote(site.id, 1, voter);
    const body = (await (
      await castVote(site.id, -1, voter)
    ).json()) as VoteBody;

    expect(body.site.upvotes).toBe(0);
    expect(body.site.downvotes).toBe(1);
  });

  it("never changes a locked reference site's moderation state", async () => {
    const site = await makeSite({ locked: true, moderation: "approved" });

    for (let i = 0; i < Math.abs(REJECT_THRESHOLD) + 2; i++) {
      await castVote(site.id, -1);
    }

    const stored = await getSiteById(site.id);
    expect(stored?.moderation).toBe("approved");
    expect(stored?.downvotes).toBe(Math.abs(REJECT_THRESHOLD) + 2);
  });

  it("keeps an approved site approved after a couple of late downvotes", async () => {
    const site = await makeSite({ moderation: "approved" });

    for (let i = 0; i < APPROVE_THRESHOLD; i++) await castVote(site.id, 1);
    const body = (await (await castVote(site.id, -1)).json()) as VoteBody;

    expect(body.site.moderation).toBe("approved");
  });

  it("rejects a vote value other than +1 or -1 with 400", async () => {
    const site = await makeSite();
    const response = await castVote(site.id, 5);
    expect(response.status).toBe(400);
  });

  it("returns 404 for a non-existent site", async () => {
    const response = await castVote(randomUUID(), 1);
    expect(response.status).toBe(404);
  });

  it("returns 400 for a malformed id", async () => {
    const response = await POST(
      new Request("http://localhost/api/sites/not-a-uuid/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: 1 }),
      }),
      { params: Promise.resolve({ id: "not-a-uuid" }) },
    );
    expect(response.status).toBe(400);
  });
});
