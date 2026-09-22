/**
 * Community-moderation thresholds. Deliberately low: the site is a joke with
 * a real map underneath, and a queue nobody can clear isn't fun. Raise these
 * if brigading ever becomes a real problem.
 */
export const APPROVE_THRESHOLD = 3;
export const REJECT_THRESHOLD = -3;

/** Votes are +1 (confirm) or -1 (dispute). */
export const VOTE_UP = 1;
export const VOTE_DOWN = -1;

export type VoteValue = typeof VOTE_UP | typeof VOTE_DOWN;

/**
 * How long a submission stays open for review before it can reach the map,
 * however fast it clears the threshold.
 *
 * Three people voting inside a minute is not the community agreeing, it's
 * whoever happened to be on the queue page — and one person with a phone,
 * a laptop and a VPN can be all three. A fixed window means a submission has
 * to survive a full day of anyone who cares being able to look at it.
 *
 * It applies to promotion only. Obvious junk still gets discarded the moment
 * it hits the rejection threshold, because a queue clogged with spam is what
 * stops people reviewing the real entries.
 */
export const VOTING_WINDOW_HOURS = 24;
export const VOTING_WINDOW_MS = VOTING_WINDOW_HOURS * 60 * 60 * 1000;

/** When a review window opened now would close. */
export function votingEndsAtFrom(openedAt: Date = new Date()): Date {
  return new Date(openedAt.getTime() + VOTING_WINDOW_MS);
}

export function votingClosed(
  votingEndsAt: Date | string,
  now: Date = new Date(),
): boolean {
  return new Date(votingEndsAt).getTime() <= now.getTime();
}

/** Milliseconds left in the window, floored at zero. */
export function msUntilVotingCloses(
  votingEndsAt: Date | string,
  now: Date = new Date(),
): number {
  return Math.max(0, new Date(votingEndsAt).getTime() - now.getTime());
}

/**
 * The share of ballots that confirm, 0–1.
 *
 * `null` when nobody has voted: "0% confirm" and "nobody has looked at this
 * yet" are very different things and the UI has to be able to tell them
 * apart.
 */
export function confirmShare(
  upvotes: number,
  downvotes: number,
): number | null {
  const total = upvotes + downvotes;
  return total === 0 ? null : upvotes / total;
}

/** Whole-percent string for display. `null` share renders as an em dash. */
export function formatShare(share: number | null): string {
  return share === null ? "—" : `${Math.round(share * 100)}%`;
}

/**
 * Where the tally currently stands against the thresholds, expressed without
 * leaking the raw counts.
 */
export type ConsensusState = "clearing" | "undecided" | "failing";

export function consensusState(
  upvotes: number,
  downvotes: number,
): ConsensusState {
  const net = upvotes - downvotes;
  if (net <= REJECT_THRESHOLD) return "failing";
  if (net >= APPROVE_THRESHOLD) return "clearing";
  return "undecided";
}
