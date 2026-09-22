import type { Metadata } from "next";
import Link from "next/link";

import { ProximityPoster } from "@/components/proximity/ProximityPoster";
import { siteOrigin } from "@/lib/config/site";
import { getSiteById } from "@/lib/db/queries/sites";
import type { Site } from "@/lib/db/schema";
import { buildResultPath, parseResultParams, type ProximityResult } from "@/lib/share/share-link";
import { formatKm, verdictFor } from "@/lib/share/verdict";

type Props = PageProps<"/r">;

interface Loaded {
  result: ProximityResult;
  site: Site;
}

/** A shared link resolves only against a site that's actually on the board. */
async function load(searchParams: Props["searchParams"]): Promise<Loaded | null> {
  const result = parseResultParams(await searchParams);
  if (!result) return null;
  try {
    const site = await getSiteById(result.siteId);
    return site && site.moderation === "approved" ? { result, site } : null;
  } catch (error) {
    console.error("[r] site lookup failed", error);
    return null;
  }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const loaded = await load(searchParams);
  if (!loaded) return { title: "How close is the nearest AI? — AI D-Day" };

  const { result } = loaded;
  const title = `The nearest AI is ${formatKm(result.km)} from me — ${verdictFor(result.km).title}`;
  const image = `/r/og${buildResultPath(result).slice(2)}`;
  return {
    metadataBase: new URL(siteOrigin()),
    title,
    description: "AI D-Day: a satirical community map of the world's datacenters. How close is yours?",
    openGraph: { title, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, images: [image] },
  };
}

export default async function SharedResultPage({ searchParams }: Props) {
  const loaded = await load(searchParams);

  return (
    <div className="flex flex-1 items-center justify-center p-4 py-10">
      <div className="hard-border hard-shadow slam-in w-full max-w-md bg-panel p-6 sm:p-7">
        {loaded ? (
          <ProximityPoster
            km={loaded.result.km}
            siteName={loaded.site.name}
            approxCount={loaded.site.approxCount}
            nearbyCount={loaded.result.nearbyCount}
            subject="them"
          />
        ) : (
          <h1 className="poster text-4xl leading-[1.05]">Somebody sent you a broken link.</h1>
        )}

        <div className="mt-6 border-t-2 border-line pt-5">
          <p className="poster text-2xl leading-tight">How close is yours?</p>
          <p className="mt-1 text-sm text-ink-dim">
            One tap. Your location stays in your browser.
          </p>
          <Link
            href="/?check=1"
            className="hard-border hard-shadow pressable mt-4 inline-block border-pop bg-pop px-4 py-2 text-sm font-bold text-paper"
          >
            Check mine
          </Link>
        </div>
      </div>
    </div>
  );
}
