import L from "leaflet";

import type { Site } from "@/lib/db/schema";

/**
 * Pins read as switchgear on a one-line diagram, not map teardrops: a filled
 * square is energised, a hollow one has been taken offline. Size carries the
 * site's claimed scale so the map shows where the compute actually is rather
 * than treating a 120-building campus and a single shed identically.
 */
function sizeFor(approxCount: number): number {
  if (approxCount >= 40) return 22;
  if (approxCount >= 15) return 18;
  if (approxCount >= 5) return 15;
  return 12;
}

export function siteIcon(site: Site, arriving = false): L.DivIcon {
  const size = sizeFor(site.approxCount);
  const neutralized = site.status === "neutralized";
  const color = neutralized ? "var(--ok)" : "var(--alert)";

  // Sourced reference sites get a centre dot — a reviewer can tell at a
  // glance which pins are the anchored set and which the community added.
  const mark = site.locked
    ? `<span style="position:absolute;inset:0;margin:auto;width:3px;height:3px;background:var(--line);"></span>`
    : "";

  return L.divIcon({
    className: arriving ? "site-pin--arriving" : "",
    html:
      `<div style="position:relative;width:${size}px;height:${size}px;` +
      `background:${neutralized ? "transparent" : color};` +
      `border:2px solid ${color};box-shadow:2px 2px 0 var(--shadow-color);">${mark}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
