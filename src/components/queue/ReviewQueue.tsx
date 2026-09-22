"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { VoteControls } from "@/components/vote/VoteControls";
import { useSites } from "@/hooks/use-sites";
import { useVote } from "@/hooks/use-vote";
import { VOTE_DOWN, VOTE_UP, type VoteValue } from "@/lib/config/moderation";

import { QueueCard } from "./QueueCard";
import { QueueEmpty } from "./QueueEmpty";
import { QueueVerdict, type Verdict } from "./QueueVerdict";

/**
 * A one-at-a-time review deck rather than a scrolling list. A list invites
 * skimming and nobody finishes it; a deck with a visible remaining count and
 * keyboard shortcuts turns clearing the queue into something people actually
 * do in one sitting.
 */
export function ReviewQueue() {
  const { sites, myVotes, loading, error, refetch, setMyVote } =
    useSites("pending");
  const { vote, pendingId } = useVote();
  const [index, setIndex] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  const site = sites[index];
  const remaining = sites.length - index;

  const advance = useCallback(() => {
    setVerdict(null);
    setIndex((current) => current + 1);
  }, []);

  const handleVote = useCallback(
    async (value: VoteValue) => {
      if (!site) return;
      setVoteError(null);

      const result = await vote(site.id, value);
      if (!result) {
        setVoteError("That vote didn't go through. Try again.");
        return;
      }

      setMyVote(site.id, value);

      // Only a state *change* is worth interrupting the flow for. An ordinary
      // vote that leaves the entry pending just moves the deck along.
      if (result.promoted || result.rejected) {
        setVerdict(result.promoted ? "approved" : "rejected");
        return;
      }
      advance();
    },
    [advance, site, setMyVote, vote],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();

      if (verdict) {
        if (key === "enter" || key === " ") {
          event.preventDefault();
          advance();
        }
        return;
      }
      if (!site || pendingId) return;

      if (key === "c" || key === "arrowright") {
        event.preventDefault();
        void handleVote(VOTE_UP);
      } else if (key === "d" || key === "arrowleft") {
        event.preventDefault();
        void handleVote(VOTE_DOWN);
      } else if (key === "s" || key === "arrowdown") {
        event.preventDefault();
        advance();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advance, handleVote, pendingId, site, verdict]);

  if (loading) {
    return <Shell>Loading the queue…</Shell>;
  }

  if (error) {
    return (
      <Shell>
        <p className="text-alert">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="hard-border hard-shadow pressable bg-panel mt-4 px-4 py-2 text-sm font-bold"
        >
          Retry
        </button>
      </Shell>
    );
  }

  if (!site) {
    return <QueueEmpty reviewed={index} />;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="poster text-xl">Review queue</h1>
        <p className="text-sm text-ink-dim">
          <span className="figure">{remaining}</span> left
        </p>
      </div>

      <div className="hard-border hard-shadow relative bg-panel p-4 sm:p-5">
        {verdict ? (
          <QueueVerdict
            verdict={verdict}
            siteName={site.name}
            onContinue={advance}
            hasMore={remaining > 1}
          />
        ) : (
          <div className="flex flex-col gap-5">
            <QueueCard site={site} />
            <VoteControls
              site={site}
              myVote={myVotes[site.id]}
              pending={pendingId === site.id}
              onVote={(value) => void handleVote(value)}
            />
            {voteError && <p className="text-sm text-alert">{voteError}</p>}
            <button
              type="button"
              onClick={advance}
              className="self-start text-sm text-ink-dim underline underline-offset-2"
            >
              Skip — I can&rsquo;t tell
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-ink-dim">
        Keys: <Key>C</Key> confirm, <Key>D</Key> dispute, <Key>S</Key> skip.
      </p>

      <Link
        href="/"
        className="text-sm text-ink-dim underline underline-offset-2"
      >
        Back to the map
      </Link>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl p-6 text-sm text-ink-dim">
      {children}
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="figure hard-border bg-panel px-1.5 py-0.5 text-[0.7rem] font-semibold">
      {children}
    </kbd>
  );
}
