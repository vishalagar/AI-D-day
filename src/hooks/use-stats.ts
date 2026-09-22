"use client";

import { useEffect, useState } from "react";

export interface BoardStats {
  totalSites: number;
  totalApproxDatacenters: number;
  activeCount: number;
  neutralizedCount: number;
  pendingCount: number;
  votesCast: number;
}

export const EMPTY_STATS: BoardStats = {
  totalSites: 0,
  totalApproxDatacenters: 0,
  activeCount: 0,
  neutralizedCount: 0,
  pendingCount: 0,
  votesCast: 0,
};

interface UseStatsResult {
  stats: BoardStats;
  /**
   * True once a reading has actually arrived. Callers that put a number in a
   * sentence need this — "around 0 datacenters" is a worse first impression
   * than showing nothing for a beat.
   */
  loaded: boolean;
}

/**
 * One reading of the board, shared by everything that quotes a number.
 *
 * Bumping `refreshKey` refetches — that's how a mutation elsewhere on the
 * page moves these counters without a full reload.
 */
export function useStats(refreshKey: number): UseStatsResult {
  const [stats, setStats] = useState<BoardStats>(EMPTY_STATS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((response) => {
        if (!response.ok) throw new Error("Request failed");
        return response.json();
      })
      .then((data: BoardStats) => {
        if (cancelled) return;
        setStats(data);
        setLoaded(true);
      })
      .catch(() => {
        // Supplementary — a failed fetch just keeps the prior reading rather
        // than blanking counters that were correct a moment ago.
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { stats, loaded };
}
