import type { Site } from "@/lib/db/schema";

const statusLabel: Record<Site["status"], string> = {
  active: "Still humming",
  neutralized: "Handled",
};

const statusClass: Record<Site["status"], string> = {
  active: "border-alert text-alert",
  neutralized: "border-ok text-ok",
};

export function StatusBadge({ status }: { status: Site["status"] }) {
  return <Badge className={statusClass[status]}>{statusLabel[status]}</Badge>;
}

const moderationLabel: Record<Site["moderation"], string> = {
  pending: "Up for debate",
  approved: "Confirmed",
  rejected: "Discarded",
};

const moderationClass: Record<Site["moderation"], string> = {
  pending: "border-watch text-watch",
  approved: "border-ok text-ok",
  rejected: "border-alert text-alert",
};

export function ModerationBadge({ site }: { site: Site }) {
  if (site.locked) {
    return <Badge className="border-ink text-ink">Sourced reference</Badge>;
  }
  return (
    <Badge className={moderationClass[site.moderation]}>
      {moderationLabel[site.moderation]}
    </Badge>
  );
}

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`hard-border inline-block px-2 py-0.5 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}
