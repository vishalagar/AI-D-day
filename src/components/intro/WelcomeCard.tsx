"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import type { BoardStats } from "@/hooks/use-stats";

interface WelcomeCardProps {
  stats: BoardStats;
  onDismiss: () => void;
  /** Runs the "how close is the nearest AI" check — the hook of the site. */
  onCheck: () => void;
}

/**
 * The first thing a newcomer sees, and the only place the joke is told
 * outright. Without it the map opens on a grid of numbers and a lot of red
 * squares, which reads as a real incident board rather than a bit.
 */
export function WelcomeCard({ stats, onDismiss, onCheck }: WelcomeCardProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  const confirmed = stats.activeCount + stats.neutralizedCount;
  const handledPercent =
    confirmed === 0 ? 0 : (stats.neutralizedCount / confirmed) * 100;

  return (
    <div
      className="absolute inset-0 z-[1500] flex items-center justify-center bg-ink/45 p-4"
      onClick={onDismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-heading"
        onClick={(event) => event.stopPropagation()}
        className="hard-border hard-shadow slam-in bg-panel relative w-full max-w-lg overflow-y-auto max-h-full p-5 sm:p-7"
      >
        <Stamp percent={handledPercent} />

        <h1
          id="welcome-heading"
          className="poster max-w-[14ch] text-3xl leading-[1.05] sm:text-4xl"
        >
          The AI has to live somewhere.
        </h1>

        <div className="mt-4 flex max-w-prose flex-col gap-3 text-sm leading-relaxed">
          <p>
            Around{" "}
            <span className="figure font-semibold text-alert">
              {stats.totalApproxDatacenters.toLocaleString()}
            </span>{" "}
            datacenters on this map are turning a small country&rsquo;s worth
            of electricity into chatbots. One of them is closer to you than you
            think.
          </p>
          <p>
            Find yours and post it. Then help keep the map honest: drop a pin
            where you reckon one is, or vote on everyone else&rsquo;s. No
            sign-up, no admin.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="pop" onClick={onCheck}>
            How close is the nearest AI?
          </Button>
          <Button onClick={onDismiss}>Just show me the map</Button>
          <Link
            href="/guide"
            className="text-sm font-semibold underline underline-offset-4 decoration-2"
          >
            How this works
          </Link>
        </div>

        <p className="mt-6 border-t-2 border-line pt-3 text-xs text-ink-dim">
          This is satire. It is not intelligence, not a target list, and nothing
          on it should ever be acted on. Read it for the bit.
        </p>
      </div>
    </div>
  );
}

/**
 * A rubber stamp, not a statistic. It's the punchline of the whole board —
 * the number is going to say 0.0% forever — so it gets the treatment of
 * something slapped onto a file, angled and slightly off the edge.
 */
function Stamp({ percent }: { percent: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-3 top-3 -rotate-6 border-[3px] border-alert px-2 py-1 text-center text-alert sm:right-5 sm:top-5"
    >
      <span className="figure block text-lg font-bold leading-none">
        {percent.toFixed(1)}%
      </span>
      <span className="block text-[10px] font-bold tracking-[0.2em]">
        HANDLED
      </span>
    </div>
  );
}
