"use client";

import { useEffect, useState } from "react";

/**
 * A clock that re-renders its consumer on an interval, for countdowns that
 * would otherwise freeze at whatever they read on mount.
 *
 * Thirty seconds by default because the only thing reading it displays
 * minutes — ticking faster would just burn renders to redraw the same text.
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
