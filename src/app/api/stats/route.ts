import { NextResponse } from "next/server";

import { getStats } from "@/lib/db/queries/stats";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/stats failed", error);
    return NextResponse.json(
      { error: "Failed to load stats" },
      { status: 500 },
    );
  }
}
