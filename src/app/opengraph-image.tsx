import { ImageResponse } from "next/og";

import { OG, OG_BACKGROUND } from "@/lib/og/palette";
import { ogFonts } from "@/lib/og/fonts";

export const alt = "AI D-Day — how close is the nearest AI?";
export const size = OG.size;
export const contentType = "image/png";

/** Scattered "still humming" squares, fixed so the image is deterministic. */
const PINS = [
  [120, 110, 22], [180, 150, 15], [90, 250, 18], [960, 120, 15], [1010, 160, 22],
  [1060, 100, 12], [890, 470, 15], [1070, 500, 18], [110, 480, 12], [210, 520, 15],
] as const;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          ...OG_BACKGROUND,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          color: OG.ink,
          fontFamily: "Archivo",
        }}
      >
        {PINS.map(([x, y, s]) => (
          <div
            key={`${x}-${y}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s * 2,
              height: s * 2,
              backgroundColor: OG.alert,
              border: `4px solid ${OG.alert}`,
              boxShadow: `4px 4px 0 ${OG.ink}`,
            }}
          />
        ))}
        <div style={{ fontFamily: "Archivo Black", fontSize: 44, letterSpacing: -2 }}>AI D-DAY</div>
        <div
          style={{
            fontFamily: "Archivo Black",
            fontSize: 104,
            lineHeight: 1,
            letterSpacing: -4,
            textAlign: "center",
            maxWidth: 900,
            marginTop: 18,
          }}
        >
          How close is the nearest AI?
        </div>
        <div
          style={{
            marginTop: 40,
            backgroundColor: OG.pop,
            color: OG.panel,
            border: `4px solid ${OG.ink}`,
            boxShadow: `8px 8px 0 ${OG.ink}`,
            padding: "14px 28px",
            fontSize: 34,
          }}
        >
          Find out in one tap
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
