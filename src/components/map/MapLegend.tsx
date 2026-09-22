"use client";

import { useState } from "react";

/**
 * Collapsible because the pin language (filled/hollow, size, centre dot) is
 * only needed once. Open by default so a first-time visitor can read the
 * board straight away; collapsed state is intentionally not persisted — it
 * costs one click and isn't worth a storage key.
 */
export function MapLegend() {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hard-border hard-shadow-sm pressable bg-panel px-2 py-1 text-xs font-semibold"
      >
        Legend
      </button>
    );
  }

  return (
    <div className="hard-border hard-shadow-sm bg-panel p-2.5 text-xs">
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="font-semibold">Legend</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Hide legend"
          className="text-ink-dim underline underline-offset-2"
        >
          Hide
        </button>
      </div>
      <ul className="flex flex-col gap-1.5">
        <Item swatch={<Square filled />}>Still humming</Item>
        <Item swatch={<Square />}>Handled, allegedly</Item>
        <Item swatch={<Square filled dot />}>Backed by a real source</Item>
      </ul>
      <p className="mt-2 max-w-44 text-ink-dim">
        Bigger square, more datacenters claimed at that spot.
      </p>
    </div>
  );
}

function Item({
  swatch,
  children,
}: {
  swatch: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      {swatch}
      <span>{children}</span>
    </li>
  );
}

function Square({ filled, dot }: { filled?: boolean; dot?: boolean }) {
  return (
    <span
      aria-hidden
      className="relative inline-block h-3.5 w-3.5 shrink-0 border-2"
      style={{
        borderColor: filled ? "var(--alert)" : "var(--ok)",
        background: filled ? "var(--alert)" : "transparent",
      }}
    >
      {dot && (
        <span
          className="absolute inset-0 m-auto h-[3px] w-[3px]"
          style={{ background: "var(--line)" }}
        />
      )}
    </span>
  );
}
