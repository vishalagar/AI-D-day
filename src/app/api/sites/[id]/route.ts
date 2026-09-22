import { NextResponse } from "next/server";

import { votingEndsAtFrom } from "@/lib/config/moderation";
import { getSiteById, updateSite } from "@/lib/db/queries/sites";
import { clearVotes } from "@/lib/db/queries/votes";
import { getClientKey, limitUpdateSite } from "@/lib/rate-limit";
import { sanitizeOptional, stripHtml } from "@/lib/sanitize";
import { siteIdSchema, updateSiteSchema } from "@/lib/validation/site-schemas";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Fields that describe *what the site is*. Changing any of them invalidates
 * whatever the previous voters agreed to, so the entry goes back through
 * review. Flipping `status` (active/neutralized) is the satire game mechanic
 * and does not, since it doesn't change the underlying claim.
 */
const CLAIM_FIELDS = [
  "name",
  "lat",
  "lng",
  "approxCount",
  "operator",
  "notes",
  "sourceUrl",
] as const;

function changesTheClaim(data: Record<string, unknown>): boolean {
  return CLAIM_FIELDS.some((field) => data[field] !== undefined);
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const idResult = siteIdSchema.safeParse(id);
  if (!idResult.success) {
    return NextResponse.json({ error: "Invalid site id" }, { status: 400 });
  }

  try {
    const site = await getSiteById(idResult.data);
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }
    return NextResponse.json({ site });
  } catch (error) {
    console.error("GET /api/sites/[id] failed", error);
    return NextResponse.json({ error: "Failed to load site" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const idResult = siteIdSchema.safeParse(id);
  if (!idResult.success) {
    return NextResponse.json({ error: "Invalid site id" }, { status: 400 });
  }

  const { success } = await limitUpdateSite(getClientKey(request));
  if (!success) {
    return NextResponse.json(
      { error: "Too many edits recently. Try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSiteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid site data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const existing = await getSiteById(idResult.data);
    if (!existing) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const { name, operator, notes, ...rest } = parsed.data;
    const resetForReview = !existing.locked && changesTheClaim(parsed.data);

    if (existing.locked && changesTheClaim(parsed.data)) {
      return NextResponse.json(
        {
          error:
            "This is a sourced reference site and can't be edited. Log a separate entry if you have better information.",
        },
        { status: 403 },
      );
    }

    const site = await updateSite(idResult.data, {
      ...rest,
      ...(name !== undefined ? { name: stripHtml(name) } : {}),
      ...(operator !== undefined
        ? { operator: sanitizeOptional(operator) }
        : {}),
      ...(notes !== undefined ? { notes: sanitizeOptional(notes) } : {}),
      ...(resetForReview
        ? {
            moderation: "pending" as const,
            upvotes: 0,
            downvotes: 0,
            // A new claim gets a new window. Inheriting the old deadline
            // would let someone wait out 24 hours on a placeholder and then
            // swap in the real claim with the review period already spent.
            votingEndsAt: votingEndsAtFrom(),
          }
        : {}),
    });

    if (resetForReview) {
      // Ballots cast against the old claim must not carry over to the new
      // one. Done after the update so a failure here can't leave the site
      // approved with a tally that no longer matches its votes.
      await clearVotes(idResult.data);
    }

    return NextResponse.json({ site, returnedToReview: resetForReview });
  } catch (error) {
    console.error("PATCH /api/sites/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to update site" },
      { status: 500 },
    );
  }
}
