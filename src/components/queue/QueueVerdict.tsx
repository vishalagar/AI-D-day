export type Verdict = "approved" | "rejected";

interface QueueVerdictProps {
  verdict: Verdict;
  siteName: string;
  hasMore: boolean;
  onContinue: () => void;
}

const COPY: Record<Verdict, { headline: string; body: string; tone: string }> = {
  approved: {
    headline: "On the board",
    body: "Your vote carried it over the line. It's live on the map for everyone now.",
    tone: "text-ok border-ok",
  },
  rejected: {
    headline: "Discarded",
    body: "The community called it. It's off the map and out of the queue.",
    tone: "text-alert border-alert",
  },
};

/**
 * Shown only when a vote actually flips a site's state. Reviewing is
 * otherwise invisible work — this is the one moment that shows a reviewer
 * their vote decided something.
 */
export function QueueVerdict({
  verdict,
  siteName,
  hasMore,
  onContinue,
}: QueueVerdictProps) {
  const copy = COPY[verdict];

  return (
    <div className="flex flex-col items-start gap-3 py-6">
      <span
        className={`hard-border px-2.5 py-1 text-sm font-bold ${copy.tone}`}
      >
        {copy.headline}
      </span>
      <p className="text-lg font-semibold leading-snug">{siteName}</p>
      <p className="max-w-prose text-sm text-ink-dim">{copy.body}</p>
      <button
        type="button"
        onClick={onContinue}
        autoFocus
        className="hard-border hard-shadow pressable bg-panel mt-2 px-4 py-2 text-sm font-bold"
      >
        {hasMore ? "Next submission" : "Finish"}
      </button>
    </div>
  );
}
