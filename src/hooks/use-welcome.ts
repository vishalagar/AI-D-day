"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ai-dday-welcomed";

interface UseWelcomeResult {
  /** False until the client has checked storage, so nothing flashes on SSR. */
  showWelcome: boolean;
  dismissWelcome: () => void;
}

/**
 * Shows the intro once per browser. Deliberately not a session flag — seeing
 * the joke explained on every visit is worse than never seeing it at all.
 */
export function useWelcome(): UseWelcomeResult {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Reading an external store (localStorage) on mount. It can throw in
    // private mode or with site data blocked, in which case the visitor just
    // gets the intro again next time — harmless, so it fails quiet.
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowWelcome(true);
      }
    } catch {
      setShowWelcome(true);
    }
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Can't persist — the intro reappears next visit. Not worth surfacing.
    }
  }, []);

  return { showWelcome, dismissWelcome };
}
