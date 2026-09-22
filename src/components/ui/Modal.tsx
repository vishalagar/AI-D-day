"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/** Never fires: "has this mounted on the client" is not a changing value. */
const noSubscribe = () => () => {};

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  // Not a direct portal: `document` doesn't exist on the server, and the
  // first client render has to match the server's markup before the portal
  // can move anything.
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  // Portalled to <body> rather than left where it is rendered. A z-index
  // only competes inside its own stacking context, and the modal sits in
  // the map's subtree — anything above it gaining a transform, filter or
  // z-index would trap the overlay under the tiles again, which is exactly
  // the bug this had. Escaping to <body> makes the ordering unconditional.
  return createPortal(
    <div
      // Still above Leaflet on its own: Leaflet gives its panes z-index
      // 200-400 and its controls 1000, so anything below that renders
      // *underneath* the map.
      className="fixed inset-0 z-[2000] flex items-start justify-end bg-ink/40 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="hard-border hard-shadow bg-panel text-ink w-full max-w-sm max-h-full overflow-y-auto"
      >
        <div className="hard-border border-t-0 border-x-0 flex items-center justify-between px-4 py-3">
          <h2 className="font-display text-sm tracking-wide">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="pressable hard-border w-7 h-7 flex items-center justify-center text-sm"
          >
            X
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
