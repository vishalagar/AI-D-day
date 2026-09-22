import { NEARBY_RADIUS_KM } from "@/lib/geo/distance";
import { formatKm, verdictFor } from "@/lib/share/verdict";

interface ProximityPosterProps {
  km: number;
  siteName: string;
  approxCount: number;
  nearbyCount: number;
  /** Whose distance this is — "you" on your own result, "them" on a shared link. */
  subject: "you" | "them";
}

/**
 * The result as a poster: one enormous distance, the verdict slapped on as a
 * rubber stamp. Shared by the in-map card and the /r landing page so a link
 * someone taps looks exactly like the thing their friend screenshotted.
 */
export function ProximityPoster({
  km,
  siteName,
  approxCount,
  nearbyCount,
  subject,
}: ProximityPosterProps) {
  const verdict = verdictFor(km);
  const from = subject === "you" ? "from you" : "from them";

  return (
    <div className="relative">
      <VerdictStamp title={verdict.title} />

      <p className="text-sm font-semibold">The nearest AI is</p>
      <p className="poster mt-1 text-6xl leading-[0.9] sm:text-7xl">
        {formatKm(km)}
      </p>
      <p className="poster mt-1 text-2xl leading-none">{from}.</p>

      <p className="mt-4 max-w-[34ch] text-base leading-snug">{verdict.line}</p>

      <p className="mt-3 text-xs leading-relaxed text-ink-dim">
        That&rsquo;s {siteName}, with around {approxCount.toLocaleString("en-US")}{" "}
        {approxCount === 1 ? "datacenter" : "datacenters"}.
        {nearbyCount > 0 &&
          ` ${nearbyCount.toLocaleString("en-US")} more ${
            nearbyCount === 1 ? "site hums" : "sites hum"
          } within ${NEARBY_RADIUS_KM} km.`}
      </p>
    </div>
  );
}

function VerdictStamp({ title }: { title: string }) {
  return (
    <div
      aria-label={`Verdict: ${title}`}
      className="stamp-in absolute -top-1 right-0 rotate-[7deg] border-[3px] border-alert px-2 py-1 text-alert"
    >
      <span className="block text-xs font-bold uppercase tracking-[0.18em] leading-none">
        {title}
      </span>
    </div>
  );
}
