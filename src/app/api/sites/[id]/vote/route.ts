import { NextResponse } from "next/server";

import { getSiteById } from "@/lib/db/queries/sites";
import { castVote } from "@/lib/db/queries/votes";
import { getClientKey, limitVote } from "@/lib/rate-limit";
import { siteIdSchema } from "@/lib/validation/site-schemas";
import { voteSchema } from "@/lib/validation/vote-schemas";
import { deriveVoterKey } from "@/lib/voter";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const idResult = siteIdSchema.safeParse(id);
  if (!idResult.success) {
    return NextResponse.json({ error: "Invalid site id" }, { status: 400 });
  }

  const { success } = await limitVote(getClientKey(request));
  if (!success) {
    return NextResponse.json(
      { error: "Slow down — too many votes in a short window." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Vote must be +1 or -1" },
      { status: 400 },
    );
  }

  try {
    const existing = await getSiteById(idResult.data);
    if (!existing) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const site = await castVote(
      idResult.data,
      deriveVoterKey(request),
      parsed.data.value,
    );
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({
      site,
      myVote: parsed.data.value,
      // Lets the client celebrate the exact moment a site earns its pin
      // rather than having it silently appear on the next refetch.
      promoted:
        existing.moderation !== "approved" && site.moderation === "approved",
      rejected:
        existing.moderation !== "rejected" && site.moderation === "rejected",
    });
  } catch (error) {
    console.error("POST /api/sites/[id]/vote failed", error);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 },
    );
  }
}
