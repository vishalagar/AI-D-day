"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import type { Site } from "@/lib/db/schema";

interface SiteActionsProps {
  site: Site;
  onStatusChanged: (updated: Site) => void;
  onEdit: () => void;
}

/**
 * The two things you can do to a site that aren't voting: flip its
 * energised/offline state (the running joke) and correct its details.
 * Deleting is deliberately not here — discarding an entry is the
 * community's call, made through the review queue.
 */
export function SiteActions({
  site,
  onStatusChanged,
  onEdit,
}: SiteActionsProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleStatus = async () => {
    setPending(true);
    setError(null);
    try {
      const nextStatus = site.status === "active" ? "neutralized" : "active";
      const response = await fetch(`/api/sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const body = (await response.json().catch(() => null)) as {
        site?: Site;
        error?: string;
      } | null;

      if (!response.ok || !body?.site) {
        setError(body?.error ?? "Couldn't change that. Try again.");
        return;
      }
      onStatusChanged(body.site);
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t-2 border-line pt-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={site.status === "active" ? "ok" : "alert"}
          onClick={toggleStatus}
          disabled={pending}
        >
          {site.status === "active" ? "Mark handled" : "Mark still humming"}
        </Button>
        {!site.locked && (
          <Button onClick={onEdit} disabled={pending}>
            Edit details
          </Button>
        )}
      </div>
      {site.locked && (
        <p className="text-xs text-ink-dim">
          Sourced reference entries can&rsquo;t be edited. Log a separate site
          if you have better information.
        </p>
      )}
      {error && <p className="text-xs text-alert">{error}</p>}
    </div>
  );
}
