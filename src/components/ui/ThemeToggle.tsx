"use client";

import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      // The old label said "Field manual", which collided with the nav link
      // of the same name — two different things can't share a name.
      className="hard-border hard-shadow-sm pressable ml-1 bg-panel px-2.5 py-1 text-xs font-semibold text-ink"
      aria-label={`Switch to ${next} mode`}
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
