import { confirmShare, formatShare } from "@/lib/config/moderation";

interface VoteShareProps {
  upvotes: number;
  downvotes: number;
}

/**
 * The tally as a share of ballots rather than a pair of counts.
 *
 * Counts invite arithmetic — "one more and it's in" — which turns reviewing
 * into a race to be the deciding click and makes a three-vote entry look
 * like settled fact. A share says what the room thinks without telling
 * anyone how close the finish line is.
 */
export function VoteShare({ upvotes, downvotes }: VoteShareProps) {
  const share = confirmShare(upvotes, downvotes);

  if (share === null) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-ink-dim">Nobody has voted yet</p>
        <div className="hard-border h-3 bg-panel" />
      </div>
    );
  }

  const percent = Math.round(share * 100);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-ok">
          <span className="figure">{formatShare(share)}</span> confirm
        </span>
        <span className="font-semibold text-alert">
          <span className="figure">{formatShare(1 - share)}</span> dispute
        </span>
      </div>
      <div
        role="img"
        aria-label={`${percent}% of reviewers confirm this site`}
        className="hard-border flex h-3 overflow-hidden bg-panel"
      >
        <div className="bg-ok" style={{ width: `${percent}%` }} />
        <div className="bg-alert flex-1" />
      </div>
    </div>
  );
}
