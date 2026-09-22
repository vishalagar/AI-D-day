"use client";

import { useCallback, useEffect, useState } from "react";

import { VOTER_HEADER, VOTER_STORAGE_KEY } from "@/lib/voter";

function readOrCreateToken(): string {
  try {
    const existing = window.localStorage.getItem(VOTER_STORAGE_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(VOTER_STORAGE_KEY, created);
    return created;
  } catch {
    // Private mode or blocked storage: fall back to a per-session token.
    // The server still pairs it with the request IP, so votes stay deduped
    // for the length of the visit.
    return crypto.randomUUID();
  }
}

/**
 * The browser-local half of a voter's identity. Generated on first use and
 * never sent anywhere but this app's own API, where it is immediately
 * hashed together with the request IP.
 */
export function useVoterToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Reads an external store (localStorage) on mount, and must not run
    // during render or the server and client markup would diverge.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(readOrCreateToken());
  }, []);

  return token;
}

/** Adds the voter header to a fetch, once the token exists. */
export function useVoterHeaders(): () => Record<string, string> {
  const token = useVoterToken();
  return useCallback(
    (): Record<string, string> => (token ? { [VOTER_HEADER]: token } : {}),
    [token],
  );
}
