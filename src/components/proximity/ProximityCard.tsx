"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import type { Site } from "@/lib/db/schema";
import { buildResultPath, buildTweetUrl } from "@/lib/share/share-link";
import { formatKm, verdictFor } from "@/lib/share/verdict";

import { ProximityPoster } from "./ProximityPoster";

interface ProximityCardProps {
  site: Site;
  km: number;
  nearbyCount: number;
  onClose: () => void;
}

const COPIED_RESET_MS = 2000;

export function ProximityCard({ site, km, nearbyCount, onClose }: ProximityCardProps) {
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const link = `${window.location.origin}${buildResultPath({ km, siteId: site.id, nearbyCount })}`;
  const verdict = verdictFor(km);
  const tweet = `The nearest AI datacenter is ${formatKm(km)} from me. Verdict: ${verdict.title}.\n\nHow close is yours?`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), COPIED_RESET_MS);
  };

  return (
    <section
      aria-label="How close the nearest AI is"
      className="hard-border hard-shadow slam-in absolute bottom-8 right-4 z-[1200] w-[min(24rem,calc(100vw-2rem))] bg-panel p-5"
    >
      <ProximityPoster
        km={km}
        siteName={site.name}
        approxCount={site.approxCount}
        nearbyCount={nearbyCount}
        subject="you"
      />

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <a
          href={buildTweetUrl(tweet, link)}
          target="_blank"
          rel="noopener noreferrer"
          className="hard-border hard-shadow pressable border-pop bg-pop px-4 py-2 text-sm font-bold text-paper"
        >
          Post it on X
        </a>
        <Button onClick={() => void copyLink()}>
          {copied === "copied" ? "Link copied" : copied === "failed" ? "Copy failed" : "Copy link"}
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto px-1 text-sm font-semibold underline underline-offset-4"
        >
          Close
        </button>
      </div>

      <p className="mt-4 border-t-2 border-line pt-2.5 text-[11px] leading-relaxed text-ink-dim">
        Your location stayed in this browser. The link shares the distance, nothing else.
      </p>
    </section>
  );
}
