import { NextResponse } from "next/server";

import { votingEndsAtFrom } from "@/lib/config/moderation";
import { settleDueSites } from "@/lib/db/queries/settle";
import {
  createSite,
  findNearbySite,
  listSitesByModeration,
} from "@/lib/db/queries/sites";
import { getVotesByVoter } from "@/lib/db/queries/votes";
import { getClientKey, limitCreateSite } from "@/lib/rate-limit";
import { sanitizeOptional, stripHtml } from "@/lib/sanitize";
import { createSiteSchema } from "@/lib/validation/site-schemas";
import { moderationFilterSchema } from "@/lib/validation/vote-schemas";
import { deriveVoterKey } from "@/lib/voter";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filter = moderationFilterSchema.safeParse(
    url.searchParams.get("moderation") ?? undefined,
  );
  if (!filter.success) {
    return NextResponse.json(
      { error: "Invalid moderation filter" },
      { status: 400 },
    );
  }

  try {
    // Before reading, not after: an entry whose window closed while it was
    // already over the threshold has to move to `approved` here, or it would
    // show up in the queue the reader is about to render.
    await settleDueSites();

    const sites = await listSitesByModeration(filter.data);

    // Returned alongside the sites so the review queue can render each card
    // in its already-voted state on first paint instead of flickering.
    const myVotes = await getVotesByVoter(
      deriveVoterKey(request),
      sites.map((site) => site.id),
    );

    return NextResponse.json({ sites, myVotes });
  } catch (error) {
    console.error("GET /api/sites failed", error);
    return NextResponse.json(
      { error: "Failed to load sites" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { success } = await limitCreateSite(getClientKey(request));
  if (!success) {
    return NextResponse.json(
      { error: "Too many sites added recently. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid site data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    // Cheap de-dup before the insert. Without it, the review queue fills up
    // with five copies of Ashburn and reviewers stop bothering.
    const nearby = await findNearbySite(parsed.data.lat, parsed.data.lng);
    if (nearby) {
      return NextResponse.json(
        {
          error: `A site is already logged within ~5km: "${nearby.name}". Vote on that one instead.`,
          existingSite: nearby,
        },
        { status: 409 },
      );
    }

    const site = await createSite({
      name: stripHtml(parsed.data.name),
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      approxCount: parsed.data.approxCount,
      operator: sanitizeOptional(parsed.data.operator),
      notes: sanitizeOptional(parsed.data.notes),
      sourceUrl: parsed.data.sourceUrl,
      moderation: "pending",
      // Set from the app's constant rather than left to the column default,
      // so the window length has one source of truth.
      votingEndsAt: votingEndsAtFrom(),
    });
    return NextResponse.json({ site }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sites failed", error);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 },
    );
  }
}
