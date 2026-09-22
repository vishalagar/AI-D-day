"use client";

import { useCallback, useState } from "react";

import { nearestSite, type Point } from "@/lib/geo/distance";
import type { Site } from "@/lib/db/schema";

export type ProximityState =
  | { phase: "idle" }
  | { phase: "locating" }
  | { phase: "failed"; message: string }
  | { phase: "found"; you: Point; site: Site; km: number; nearbyCount: number };

const LOCATE_TIMEOUT_MS = 12_000;

/**
 * "How close is the nearest AI?" — asks the browser for a position, measures
 * it against the board, and keeps everything client-side. The coordinates
 * never leave this hook; only the rounded distance ends up in a share link.
 */
export function useProximity(sites: readonly Site[]) {
  const [state, setState] = useState<ProximityState>({ phase: "idle" });

  const measureFrom = useCallback(
    (you: Point) => {
      const result = nearestSite(you, sites);
      setState(
        result
          ? { phase: "found", you, ...result }
          : {
              phase: "failed",
              message: "Nothing on the board is still humming. Suspicious.",
            },
      );
    },
    [sites],
  );

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({
        phase: "failed",
        message: "This browser can't share a location. Tap the map where you live instead.",
      });
      return;
    }
    setState({ phase: "locating" });
    navigator.geolocation.getCurrentPosition(
      (position) =>
        measureFrom({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) =>
        setState({
          phase: "failed",
          message:
            error.code === error.PERMISSION_DENIED
              ? "No location, no problem. Tap the map where you live instead."
              : "Couldn't get a fix on you. Tap the map where you live instead.",
        }),
      // Coarse is plenty for a joke measured in kilometres, and much faster.
      { enableHighAccuracy: false, timeout: LOCATE_TIMEOUT_MS, maximumAge: 600_000 },
    );
  }, [measureFrom]);

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  return { state, locate, measureFrom, reset };
}
