# Sharing: "How close is the nearest AI?"

The share hook. Before this the site was a map to look at, and nothing on
it was personal enough to post. What people share is a result about
*themselves*, so the main thing to do on the site is now: tap once, find out
how far the nearest humming datacenter is, post the poster.

## Flow

1. **Entry points**: the pink button top-right of the map, and the primary
   CTA on the welcome card. Disabled until the board has loaded, because
   measuring against zero sites would say "nothing is humming".
2. **`useProximity(sites)`** (`src/hooks/use-proximity.ts`) asks
   `navigator.geolocation` (coarse, 12s timeout). Denied/unsupported/failed
   → the next map click is taken as "where I live" (`picking` in MapView
   reuses the add-mode click listener).
3. **`nearestSite()`** (`src/lib/geo/distance.ts`), a haversine search over
   *approved, still-humming* sites only. Handled sites don't count. It also
   counts other active sites within `NEARBY_RADIUS_KM` (250).
4. **`ProximityLayer`** flies the map to frame you and the site and draws a
   dashed `--pop` line. Padding keeps the line clear of the card (right on
   desktop, bottom 60% on phones). Reduced motion → no fly animation.
5. **`ProximityCard`**: the poster, then *Post it on X* (an intent URL, so
   no X API or keys) and *Copy link*. While it's up, the legend and the
   *Log a site* button are hidden, because on a phone they stacked under it.

## Verdict tiers (`src/lib/share/verdict.ts`)

< 5 km *Next door* · < 25 *Hum zone* · < 100 *Commuter belt* ·
< 500 *Regional* · < 2000 *Remote* · else *Off the grid*. Bounds are
exclusive. The jokes are about hum, power bills and training data, **never
about doing anything to a building**, and that has to stay true for new lines.

## Privacy

Coordinates never leave the browser. The share link is
`/r?km=<int>&site=<uuid>&n=<int>`. `buildResultPath` / `parseResultParams`
(`src/lib/share/share-link.ts`, Zod-validated) are the only way it's made or
read. The e2e spec asserts the link's keys are exactly `km, n, site`.

## Link previews

- **`/r`** (`src/app/r/page.tsx`): the landing page for a shared link. It
  looks the site up by id and **only accepts approved sites**. Its name
  comes from the DB, not the URL, so nobody can put arbitrary text into an
  image served from our domain. A bad link renders a fallback, not a 500.
  CTA *Check mine* → `/?check=1`, which runs the check once the board
  loads and then strips the query.
- **`/r/og`** (`src/app/r/og/route.tsx`): a 1200×630 `ImageResponse`
  poster. 400 on bad params, 404 on an unknown or unapproved site. It's
  cached for a day at the browser and a week at the CDN.
- **`/opengraph-image`** (`src/app/opengraph-image.tsx`): the home preview.
  It's static and needs no DB.
- Fonts (`src/lib/og/fonts.ts`) are fetched as TTF from Google Fonts at
  runtime (the 500KB bundle cap rules out shipping them). A failure falls
  back to the default face and is logged, so the image still renders.
- `metadataBase` comes from `siteOrigin()` (`src/lib/config/site.ts`):
  `NEXT_PUBLIC_SITE_URL`, then `VERCEL_PROJECT_PRODUCTION_URL`, then
  localhost. **Set `NEXT_PUBLIC_SITE_URL` if a custom domain is added**, or
  X will unfurl the `*.vercel.app` image URL.

## Tests

`src/lib/geo/__tests__`, `src/lib/share/__tests__` (unit);
`e2e/proximity.spec.ts` (geolocation granted → card → link has no coords →
`/r` renders; 375px has no horizontal scroll; a tampered link falls back).
