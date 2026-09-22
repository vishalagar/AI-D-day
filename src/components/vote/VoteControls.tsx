"use client";

import { useNow } from "@/hooks/use-now";
import {
  consensusState,
  msUntilVotingCloses,
  VOTE_DOWN,
  VOTE_UP,
  type VoteValue,
} from "@/lib/config/moderation";
import type { Site } from "@/lib/db/schema";
import { formatTimeLeft } from "@/lib/format/countdown";

import { VoteShare } from "./VoteShare";

interface VoteControlsProps {
  site: Site;
  myVote?: VoteValue;
  pending: boolean;
  onVote: (value: VoteValue) => void;
}

/**
 * Confirm / dispute, the current split of opinion, and how long is left to
 * change it. No raw counts anywhere: what makes voting feel worth doing here
 * is seeing the room move, not watching a counter approach a threshold.
 */
export function VoteControls({
  site,
  myVote,
  pending,
  onVote,
}: VoteControlsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <VoteButton
          active={myVote === VOTE_UP}
          disabled={pending}
          tone="ok"
          label="Confirm"
          hint="This site is real"
          onClick={() => onVote(VOTE_UP)}
        />
        <VoteButton
          active={myVote === VOTE_DOWN}
          disabled={pending}
          tone="alert"
          label="Dispute"
          hint="This doesn't belong"
          onClick={() => onVote(VOTE_DOWN)}
        />
      </div>

      <VoteShare upvotes={site.upvotes} downvotes={site.downvotes} />

      <p className="text-xs text-ink-dim">
        <StatusNote site={site} />
      </p>
    </div>
  );
}

function StatusNote({ site }: { site: Site }) {
  // Only the pending branch needs a live clock, but hooks can't be called
  // conditionally, so it runs for every state and is simply unused in most.
  const now = useNow();

  if (site.locked) {
    return (
      <>Sourced reference entry. Votes are recorded but it stays on the map.</>
    );
  }
  if (site.moderation === "approved") {
    return <>On the map. The community reviewed it and let it through.</>;
  }
  if (site.moderation === "rejected") {
    return (
      <>Discarded. It returns to review if confirmations outweigh disputes.</>
    );
  }

  const msLeft = msUntilVotingCloses(site.votingEndsAt, now);
  const state = consensusState(site.upvotes, site.downvotes);

  if (msLeft > 0) {
    return (
      <>
        Review closes in{" "}
        <span className="figure font-semibold">{formatTimeLeft(msLeft)}</span>.{" "}
        {state === "clearing"
          ? "On course for the map if the split holds."
          : "Not enough agreement to add it yet."}
      </>
    );
  }

  return state === "clearing" ? (
    <>Review has closed with enough agreement — it&rsquo;s headed for the map.</>
  ) : (
    <>
      Review has closed without enough agreement. It stays here until opinion
      shifts.
    </>
  );
}

function VoteButton({
  active,
  disabled,
  tone,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  tone: "ok" | "alert";
  label: string;
  hint: string;
  onClick: () => void;
}) {
  const toneClass = tone === "ok" ? "text-ok" : "text-alert";
  const activeClass =
    tone === "ok"
      ? "bg-ok text-paper border-ok"
      : "bg-alert text-paper border-alert";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={hint}
      className={`hard-border hard-shadow-sm pressable flex-1 px-3 py-2 text-left disabled:opacity-50 ${
        active ? activeClass : `bg-panel ${toneClass}`
      }`}
    >
      <span className="block text-sm font-bold leading-tight">{label}</span>
      <span className="block text-xs opacity-80">{hint}</span>
    </button>
  );
}
