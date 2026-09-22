interface LoadMeterProps {
  activeCount: number;
  neutralizedCount: number;
}

/**
 * The board's headline: one bar showing how much of the confirmed map has
 * been marked handled. It does the satire's whole job at a glance — the red
 * stretch is everything still running, and it is always almost all of it.
 */
export function LoadMeter({ activeCount, neutralizedCount }: LoadMeterProps) {
  const total = activeCount + neutralizedCount;
  const clearedPercent = total === 0 ? 0 : (neutralizedCount / total) * 100;

  return (
    <div className="flex items-center gap-3">
      <div
        className="hard-border relative h-5 flex-1 overflow-hidden bg-panel"
        role="meter"
        aria-valuenow={Math.round(clearedPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Share of confirmed sites marked handled"
      >
        <div className="absolute inset-0 bg-alert" />
        <div
          className="absolute inset-y-0 left-0 bg-ok transition-[width] duration-500"
          style={{ width: `${clearedPercent}%` }}
        />
        {/* Tick marks read as a gauge rather than a progress bar — this is a
            reading off an instrument, not a task nearing completion. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 23px, var(--line) 23px 25px)",
          }}
        />
      </div>
      <span className="figure text-sm font-semibold whitespace-nowrap">
        {clearedPercent.toFixed(1)}% handled
      </span>
    </div>
  );
}
