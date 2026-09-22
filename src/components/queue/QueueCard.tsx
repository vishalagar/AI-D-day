import type { Site } from "@/lib/db/schema";

import { LocationPreview } from "./LocationPreview";

interface QueueCardProps {
  site: Site;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function ageOf(createdAt: Date | string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** One submission, laid out so the things a reviewer judges on come first. */
export function QueueCard({ site }: QueueCardProps) {
  return (
    <article className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold leading-tight tracking-tight">
          {site.name}
        </h2>
        <p className="text-sm text-ink-dim">
          Submitted {ageOf(site.createdAt)}
        </p>
      </header>

      <LocationPreview lat={site.lat} lng={site.lng} name={site.name} />

      <dl className="flex flex-col gap-2 text-sm">
        <Row label="Claimed datacenters">
          <span className="figure">{site.approxCount.toLocaleString()}</span>
        </Row>
        <Row label="Operator">
          {site.operator ?? <Missing>not given</Missing>}
        </Row>
        <Row label="Coordinates">
          <span className="figure">
            {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
          </span>
        </Row>
        <Row label="Source">
          {site.sourceUrl ? (
            <a
              href={site.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline underline-offset-2 break-all"
            >
              {hostOf(site.sourceUrl)}
            </a>
          ) : (
            <Missing>none — judge on the map alone</Missing>
          )}
        </Row>
      </dl>

      {site.notes && (
        <p className="border-l-2 border-line pl-3 text-sm text-ink-dim">
          {site.notes}
        </p>
      )}
    </article>
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
    <div className="flex justify-between gap-3 border-b border-line/30 pb-1.5">
      <dt className="text-ink-dim shrink-0">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Missing({ children }: { children: React.ReactNode }) {
  return <span className="text-watch">{children}</span>;
}
