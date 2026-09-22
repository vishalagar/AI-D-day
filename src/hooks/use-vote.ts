"use client";

import { useCallback, useState } from "react";

import type { VoteValue } from "@/lib/config/moderation";
import type { Site } from "@/lib/db/schema";

import { useVoterHeaders } from "./use-voter";

export interface VoteResult {
  site: Site;
  myVote: VoteValue;
  promoted: boolean;
  rejected: boolean;
}

interface UseVoteResult {
  vote: (siteId: string, value: VoteValue) => Promise<VoteResult | null>;
  pendingId: string | null;
  error: string | null;
}

/**
 * Posts a ballot and hands back the server's recomputed site. The tally is
 * never derived on the client — a second voter's ballot can land between
 * the render and the click, and the server's count is the only one that has
 * seen both.
 */
export function useVote(): UseVoteResult {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const voterHeaders = useVoterHeaders();

  const vote = useCallback(
    async (siteId: string, value: VoteValue): Promise<VoteResult | null> => {
      setPendingId(siteId);
      setError(null);
      try {
        const response = await fetch(`/api/sites/${siteId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...voterHeaders() },
          body: JSON.stringify({ value }),
        });
        const body = (await response.json().catch(() => null)) as
          (VoteResult & { error?: string }) | null;

        if (!response.ok || !body?.site) {
          setError(body?.error ?? "Couldn't record that vote. Try again.");
          return null;
        }
        return body;
      } catch {
        setError("Couldn't reach the server. Try again.");
        return null;
      } finally {
        setPendingId(null);
      }
    },
    [voterHeaders],
  );

  return { vote, pendingId, error };
}
