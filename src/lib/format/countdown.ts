const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/**
 * A review countdown, rounded down to the unit a reviewer actually acts on.
 *
 * Deliberately coarse: nobody waits at the screen for a 24-hour timer, and
 * a ticking seconds display would imply the map updates the instant it hits
 * zero, which it doesn't — promotion happens on the next vote or the next
 * time the board is read.
 */
export function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "closed";

  const hours = Math.floor(ms / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);

  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "under a minute";
}
