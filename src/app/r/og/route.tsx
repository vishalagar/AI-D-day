import { ImageResponse } from "next/og";

import { getSiteById } from "@/lib/db/queries/sites";
import { OG, OG_BACKGROUND } from "@/lib/og/palette";
import { ogFonts } from "@/lib/og/fonts";
import { parseResultParams } from "@/lib/share/share-link";
import { formatKm, verdictFor } from "@/lib/share/verdict";

/** Preview image for a shared result — what shows up under the tweet. */
export async function GET(request: Request) {
  const params = parseResultParams(Object.fromEntries(new URL(request.url).searchParams));
  if (!params) return new Response("Bad result link", { status: 400 });

  try {
    const site = await getSiteById(params.siteId);
    if (!site || site.moderation !== "approved") {
      return new Response("Unknown site", { status: 404 });
    }
    const verdict = verdictFor(params.km);

    return new ImageResponse(
      (
        <div style={{ ...OG_BACKGROUND, width: "100%", height: "100%", display: "flex", padding: 40 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              backgroundColor: OG.panel,
              border: `4px solid ${OG.ink}`,
              boxShadow: `12px 12px 0 ${OG.ink}`,
              padding: "44px 56px",
              position: "relative",
              color: OG.ink,
              fontFamily: "Archivo",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 48,
                right: 56,
                transform: "rotate(7deg)",
                border: `6px solid ${OG.alert}`,
                color: OG.alert,
                padding: "10px 18px",
                fontSize: 34,
                letterSpacing: 5,
                textTransform: "uppercase",
              }}
            >
              {verdict.title}
            </div>
            <div style={{ fontSize: 34 }}>The nearest AI is</div>
            <div style={{ fontFamily: "Archivo Black", fontSize: 184, lineHeight: 1, letterSpacing: -8, marginTop: 6 }}>
              {formatKm(params.km)}
            </div>
            <div style={{ fontFamily: "Archivo Black", fontSize: 56, lineHeight: 1 }}>from me.</div>
            <div style={{ fontSize: 30, marginTop: 26, color: OG.inkDim, maxWidth: 820 }}>
              {verdict.line}
            </div>
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "Archivo Black", fontSize: 34, letterSpacing: -1 }}>AI D-DAY</div>
              <div
                style={{
                  backgroundColor: OG.pop,
                  color: OG.panel,
                  border: `4px solid ${OG.ink}`,
                  boxShadow: `6px 6px 0 ${OG.ink}`,
                  padding: "12px 24px",
                  fontSize: 30,
                }}
              >
                How close is yours?
              </div>
            </div>
          </div>
        </div>
      ),
      {
        ...OG.size,
        fonts: await ogFonts(),
        // Results are deterministic per URL; let the CDN keep them.
        headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
      },
    );
  } catch (error) {
    console.error("[og] result image failed", error);
    return new Response("Failed to render preview", { status: 500 });
  }
}
