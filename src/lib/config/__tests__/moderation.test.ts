import { describe, expect, it } from "vitest";

import {
  APPROVE_THRESHOLD,
  confirmShare,
  consensusState,
  formatShare,
  msUntilVotingCloses,
  REJECT_THRESHOLD,
  VOTING_WINDOW_MS,
  votingClosed,
  votingEndsAtFrom,
} from "../moderation";

describe("confirmShare", () => {
  it("is null when nobody has voted", () => {
    expect(confirmShare(0, 0)).toBeNull();
  });

  it("is 1 when every ballot confirms", () => {
    expect(confirmShare(4, 0)).toBe(1);
  });

  it("is 0 when every ballot disputes", () => {
    expect(confirmShare(0, 4)).toBe(0);
  });

  it("is the confirming fraction of all ballots", () => {
    expect(confirmShare(3, 1)).toBe(0.75);
  });
});

describe("formatShare", () => {
  it("renders a whole percentage", () => {
    expect(formatShare(0.75)).toBe("75%");
  });

  it("rounds rather than truncating", () => {
    expect(formatShare(2 / 3)).toBe("67%");
  });

  it("renders an em dash when there is nothing to show", () => {
    expect(formatShare(null)).toBe("—");
  });
});

describe("consensusState", () => {
  it("is undecided between the thresholds", () => {
    expect(consensusState(0, 0)).toBe("undecided");
    expect(consensusState(APPROVE_THRESHOLD - 1, 0)).toBe("undecided");
    expect(consensusState(0, Math.abs(REJECT_THRESHOLD) - 1)).toBe("undecided");
  });

  it("is clearing at or above the approval threshold", () => {
    expect(consensusState(APPROVE_THRESHOLD, 0)).toBe("clearing");
    expect(consensusState(APPROVE_THRESHOLD + 5, 0)).toBe("clearing");
  });

  it("is failing at or below the rejection threshold", () => {
    expect(consensusState(0, Math.abs(REJECT_THRESHOLD))).toBe("failing");
  });

  it("reads the net, not the raw counts", () => {
    // 30 up / 27 down is a near-even split but still three votes ahead.
    expect(consensusState(30, 27)).toBe("clearing");
  });
});

describe("the review window", () => {
  const openedAt = new Date("2026-09-22T10:00:00.000Z");

  it("closes one window length after it opened", () => {
    expect(votingEndsAtFrom(openedAt).getTime()).toBe(
      openedAt.getTime() + VOTING_WINDOW_MS,
    );
  });

  it("is open right up to the deadline and closed on it", () => {
    const endsAt = votingEndsAtFrom(openedAt);
    const aMomentBefore = new Date(endsAt.getTime() - 1);

    expect(votingClosed(endsAt, aMomentBefore)).toBe(false);
    expect(votingClosed(endsAt, endsAt)).toBe(true);
  });

  it("accepts the serialized string an API response carries", () => {
    const endsAt = votingEndsAtFrom(openedAt);
    expect(votingClosed(endsAt.toISOString(), openedAt)).toBe(false);
  });

  it("reports the time left, floored at zero once closed", () => {
    const endsAt = votingEndsAtFrom(openedAt);

    expect(msUntilVotingCloses(endsAt, openedAt)).toBe(VOTING_WINDOW_MS);
    expect(
      msUntilVotingCloses(endsAt, new Date(endsAt.getTime() + 60_000)),
    ).toBe(0);
  });
});
