"use client";

import L from "leaflet";
import { useEffect } from "react";
import { CircleMarker, Polyline, useMap } from "react-leaflet";

import type { Point } from "@/lib/geo/distance";

interface ProximityLayerProps {
  you: Point;
  site: Point;
}

const LINE_STYLE = { color: "var(--pop)", weight: 3, dashArray: "8 6" };
const YOU_STYLE = { color: "var(--line)", weight: 2, fillColor: "var(--pop)", fillOpacity: 1 };
const MAX_FOCUS_ZOOM = 9;
const WIDE_MIN_PX = 720;

/**
 * Draws you, a dashed line, and the nearest humming site, then flies the map
 * to frame both. The one motion here answers the button that asked for it.
 */
export function ProximityLayer({ you, site }: ProximityLayerProps) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([you.lat, you.lng], [site.lat, site.lng]);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = window.innerWidth > WIDE_MIN_PX;
    map.flyToBounds(bounds, {
      // Keep the line clear of the result card: it sits bottom-right on a
      // wide screen and fills the lower half of a phone.
      paddingTopLeft: [60, 60],
      paddingBottomRight: wide ? [440, 60] : [40, Math.round(window.innerHeight * 0.6)],
      maxZoom: MAX_FOCUS_ZOOM,
      animate: !reduceMotion,
      duration: 1.4,
    });
  }, [map, you.lat, you.lng, site.lat, site.lng]);

  return (
    <>
      <Polyline positions={[[you.lat, you.lng], [site.lat, site.lng]]} pathOptions={LINE_STYLE} />
      <CircleMarker center={[you.lat, you.lng]} radius={8} pathOptions={YOU_STYLE} />
    </>
  );
}
