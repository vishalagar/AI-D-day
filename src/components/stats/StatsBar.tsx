"use client";

import Link from "next/link";

import type { BoardStats } from "@/hooks/use-stats";

import { LoadMeter } from "./LoadMeter";

interface StatsBarProps {
  stats: BoardStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="border-b-2 border-line bg-panel px-4 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
      <div className="flex items-baseline gap-4 sm:gap-5 shrink-0">
        <Reading value={stats.totalApproxDatacenters} label="datacenters" />
        <Reading value={stats.totalSites} label="sites" />
        <Reading value={stats.votesCast} label="arguments settled" />
      </div>

      {/* Capped rather than fluid: stretched across a wide viewport the bar
          stops reading as a gauge and starts reading as an error banner. */}
      <div className="min-w-40 max-w-md flex-1">
        <LoadMeter
          activeCount={stats.activeCount}
          neutralizedCount={stats.neutralizedCount}
        />
      </div>

      {stats.pendingCount > 0 && (
        <Link
          href="/queue"
          className="hard-border hard-shadow-sm pressable bg-watch text-paper px-2.5 py-1 text-xs font-bold shrink-0 self-start sm:self-auto"
        >
          <span className="figure">{stats.pendingCount}</span> need a second
          opinion
        </Link>
      )}
    </div>
  );
}

function Reading({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="figure text-base font-semibold leading-none">
        {value.toLocaleString()}
      </span>
      <span className="text-xs text-ink-dim">{label}</span>
    </div>
  );
}
