"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/Modal";
import { ModerationBadge, StatusBadge } from "@/components/ui/Badge";
import { VoteControls } from "@/components/vote/VoteControls";
import { useVote } from "@/hooks/use-vote";
import type { VoteValue } from "@/lib/config/moderation";
import type { Site } from "@/lib/db/schema";

import { EditSiteForm } from "./EditSiteForm";
import { SiteActions } from "./SiteActions";

interface SiteDetailPanelProps {
  site: Site;
  myVote?: VoteValue;
  onClose: () => void;
  /** Panel stays open, the board refreshes in the background. */
  onUpdated: (updatedSite: Site) => void;
  /** The entry left the approved set — close the panel and drop its pin. */
  onRemoved: (siteId: string) => void;
  onVoted: (siteId: string, value: VoteValue) => void;
}

export function SiteDetailPanel({
  site,
  myVote,
  onClose,
  onUpdated,
  onRemoved,
  onVoted,
}: SiteDetailPanelProps) {
  const [current, setCurrent] = useState(site);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { vote, pendingId, error } = useVote();

  const handleVote = async (value: VoteValue) => {
    const result = await vote(current.id, value);
    if (!result) return;

    setCurrent(result.site);
    onVoted(current.id, value);

    if (result.rejected) {
      onRemoved(current.id);
      return;
    }
    onUpdated(result.site);
  };

  if (editing) {
    return (
      <Modal title="Edit site" onClose={() => setEditing(false)}>
        <EditSiteForm
          site={current}
          onCancel={() => setEditing(false)}
          onSaved={(updated, returnedToReview) => {
            setCurrent(updated);
            setEditing(false);
            if (returnedToReview) {
              setNotice(
                "Edited. Because the details changed, it's back in the review queue until the community confirms it again.",
              );
              onRemoved(updated.id);
            } else {
              onUpdated(updated);
            }
          }}
        />
      </Modal>
    );
  }

  return (
    <Modal title={current.name} onClose={onClose}>
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={current.status} />
          <ModerationBadge site={current} />
        </div>

        {notice && (
          <p className="hard-border border-watch text-watch px-2 py-1.5 text-xs">
            {notice}
          </p>
        )}

        <dl className="flex flex-col gap-1.5">
          <Row label="Est. datacenters">
            <span className="figure">
              {current.approxCount.toLocaleString()}
            </span>
          </Row>
          {current.operator && <Row label="Operator">{current.operator}</Row>}
          <Row label="Coordinates">
            <span className="figure">
              {current.lat.toFixed(4)}, {current.lng.toFixed(4)}
            </span>
          </Row>
          {current.sourceUrl && (
            <Row label="Source">
              <a
                href={current.sourceUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="underline underline-offset-2 break-all"
              >
                {current.sourceUrl.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </Row>
          )}
        </dl>

        {current.notes && (
          <p className="border-l-2 border-line pl-3 text-ink-dim">
            {current.notes}
          </p>
        )}

        <VoteControls
          site={current}
          myVote={myVote}
          pending={pendingId === current.id}
          onVote={(value) => void handleVote(value)}
        />
        {error && <p className="text-xs text-alert">{error}</p>}

        <SiteActions
          site={current}
          onStatusChanged={(updated) => {
            setCurrent(updated);
            onUpdated(updated);
          }}
          onEdit={() => setEditing(true)}
        />
      </div>
    </Modal>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-dim shrink-0">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
