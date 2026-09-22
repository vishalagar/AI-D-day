"use client";

import { useCallback, useEffect, useState } from "react";

import type { VoteValue } from "@/lib/config/moderation";
import type { Site, SiteModeration } from "@/lib/db/schema";

import { useVoterHeaders } from "./use-voter";

interface UseSitesResult {
  sites: Site[];
  /** How this browser already voted, keyed by site id. */
  myVotes: Record<string, VoteValue>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Swaps one site in place without refetching the whole board. */
  replaceSite: (site: Site) => void;
  removeSite: (siteId: string) => void;
  setMyVote: (siteId: string, value: VoteValue) => void;
}

export function useSites(moderation: SiteModeration = "approved"): UseSitesResult {
  const [sites, setSites] = useState<Site[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, VoteValue>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const voterHeaders = useVoterHeaders();

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sites?moderation=${moderation}`, {
        headers: voterHeaders(),
      });
      if (!response.ok) throw new Error("Request failed");
      const data = (await response.json()) as {
        sites: Site[];
        myVotes: Record<string, VoteValue>;
      };
      setSites(data.sites);
      setMyVotes(data.myVotes ?? {});
    } catch {
      setError("Couldn't reach the board. Check your connection and retry.");
    } finally {
      setLoading(false);
    }
  }, [moderation, voterHeaders]);

  useEffect(() => {
    // Initial load from an external system (the API) — the React-endorsed
    // use of an effect, not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  const replaceSite = useCallback((updated: Site) => {
    setSites((current) =>
      current.map((site) => (site.id === updated.id ? updated : site)),
    );
  }, []);

  const removeSite = useCallback((siteId: string) => {
    setSites((current) => current.filter((site) => site.id !== siteId));
  }, []);

  const setMyVote = useCallback((siteId: string, value: VoteValue) => {
    setMyVotes((current) => ({ ...current, [siteId]: value }));
  }, []);

  return {
    sites,
    myVotes,
    loading,
    error,
    refetch,
    replaceSite,
    removeSite,
    setMyVote,
  };
}
