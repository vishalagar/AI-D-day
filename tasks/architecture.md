# Architecture

Next.js App Router, **Node runtime everywhere** (`export const runtime =
"nodejs"` on every route). No Edge — the DB client and `node:crypto` both
want Node, and Fluid Compute makes Edge pointless here.

## Request flow

```
browser
  │
  ├─ GET  /api/sites?moderation=approved   → map pins + this voter's ballots
  ├─ GET  /api/sites?moderation=pending    → review queue
  ├─ POST /api/sites                       → Zod → dedup check → insert pending
  ├─ PATCH /api/sites/[id]                 → Zod → lock check → maybe reset to pending
  ├─ POST /api/sites/[id]/vote             → one SQL stmt: upsert + recount + transition
  └─ GET  /api/stats                       → aggregates (approved only)
        │
     Drizzle ──→ Neon Postgres (HTTP driver, no transactions)
     Upstash ──→ Redis (rate limiting)
```

Every write is Zod-validated at the route boundary and rate-limited before
any DB work. Text fields pass through `stripHtml` for defence in depth —
React escapes output, but the raw API response has non-React consumers.

## Layout

| Path | Holds |
|---|---|
| `src/app/api/` | Route handlers. Thin: validate, rate-limit, delegate |
| `src/app/queue/` | The review deck page |
| `src/app/guide/` | Field Manual (satire disclaimer + how voting works) |
| `src/lib/config/` | Thresholds and vote constants — no magic numbers elsewhere |
| `src/lib/db/schema.ts` | Drizzle schema, enums, check constraints |
| `src/lib/db/queries/` | `sites.ts`, `votes.ts`, `stats.ts` — all SQL lives here |
| `src/lib/validation/` | Zod schemas shared by client forms and API routes |
| `src/lib/seed/` | The 83 locked reference sites, split by region |
| `src/lib/voter.ts` | Anonymous voter-key derivation (server side) |
| `src/lib/rate-limit.ts` | Lazily-built Upstash limiters |
| `src/components/map/` | Map canvas, pins, legend, forms, detail panel |
| `src/components/queue/` | Review deck, card, verdict, empty state |
| `src/components/vote/` | Confirm/dispute controls, shared by map and queue |
| `src/hooks/` | `use-sites`, `use-vote`, `use-voter`, `use-theme` |
| `src/test-utils/` | Test-only helpers, incl. the delete the app doesn't have |

## Things that are the way they are for a reason

**Lazy singletons for DB and Redis.** Both `getDb()` and the rate limiters
build on first *use*, not at module load. Next.js imports route modules
during the build's page-data collection step, before deployment env vars
exist — constructing at module scope breaks the build.

**No delete in the query layer.** `deleteSite` was removed, not just
unexported. Test teardown lives in `src/test-utils/db.ts` so the
production path has no loaded gun in it.

**Denormalized vote counters.** `sites.upvotes` / `downvotes` exist so the
map can render 83+ pins without a join or a subquery per row. They are
recomputed (not incremented) on every vote, so they can't drift.

**Client never computes a tally.** `useVote` returns the server's
recomputed site. Another voter's ballot can land between render and click,
and only the server has seen both.

**Leaflet is dynamically imported** (`MapViewLoader`, `ssr: false`). It
touches `window` at module scope.

## Known stacking-context traps

Leaflet assigns its own z-indexes inside the *same* stacking context as
the page:

| Layer | z-index |
|---|---|
| Leaflet tile pane | 200 |
| Leaflet overlay/marker panes | 400–600 |
| Leaflet controls | 1000 |
| Our map overlays (legend, notices) | 1000 |
| **Modals** | **2000** |

A modal at anything below ~1000 renders *underneath the map tiles*. This
already caused one bug; don't lower it.

`Modal` additionally portals to `document.body`. z-index only orders
siblings within a stacking context, so a `transform`, `filter`, `opacity`
or z-index added to any wrapper between the modal and `<body>` would put
it back under the tiles no matter how high the number is. The portal makes
the ordering unconditional. It renders nothing on the first pass (no
`document` on the server) and mounts in an effect.

## Dark mode

Light is the default and `prefers-color-scheme` is intentionally ignored.
An inline script in `layout.tsx` applies the stored preference before
paint, which means the server's `data-theme="light"` and the client's
value legitimately differ — hence `suppressHydrationWarning` on `<html>`.
Removing it puts a hydration error on every dark-mode page load.

The dark basemap is a CSS `filter: invert(...)` on Leaflet's tile pane
only, so our signal-coloured pins stay true. Keyless dark tile providers
kept disappearing behind API keys; this depends on nothing external.
The filter desaturates before inverting — the basemap's beige landmass
otherwise inverts to a hard olive.

## Basemap tiles

Esri's `World_Street_Map` (keyless), not OSM's standard raster tiles. OSM
labels each place in its own script, so the Gulf, Russia, Greece, China
and Japan rendered unreadable for most of this map's audience; Esri labels
in English worldwide. CARTO was tried first and now watermarks keyless
requests with "API KEY REQUIRED".

`/queue`'s `LocationPreview` still uses OSM's keyless iframe embed, which
means it keeps local-script labels.
