"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "ai-dday-theme";

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Light is the default; system prefers-color-scheme is intentionally ignored. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  // The first render always says "light" so it matches the server's markup.
  // Until the stored preference has been read back, that "light" is a
  // placeholder, not a choice — writing it to storage would erase a real
  // preference before we ever saw it, which is exactly how a saved dark mode
  // used to be lost on reload.
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    // localStorage isn't available during SSR, so the stored preference can
    // only be read after mount — a legitimate one-time sync, not derivable
    // during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readStoredTheme());
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private browsing or blocked storage — theme still applies for this view.
    }
  }, [theme, restored]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
