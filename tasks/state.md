# Session State

## 2026-09-23 (session 6): the share hook

The site was fun to look at but gave nobody a reason to post it. Added
"How close is the nearest AI?": one tap → distance to the nearest humming
site → a poster with a verdict stamp → *Post it on X*. Full write-up in
[sharing.md](sharing.md).

### Done
- `useProximity`, `nearestSite` (haversine), verdict tiers, share links.
  Coordinates stay client-side; the link carries only km, site id and a count.
- The map flies to you and draws a dashed line to the site; `ProximityCard`
  shows the result. If geolocation is denied you tap the map instead.
- `/r` share landing page + `/r/og` dynamic preview image + home
  `opengraph-image`. `metadataBase` via `siteOrigin()`.
- Welcome card rewritten around the hook ("The AI has to live somewhere.").
- Fixed stale e2e string (`waiting on review` → `need a second opinion`),
  missed in session 5.
- Launch video made with `/brag` (see below).

### Verified
109 Vitest + 11 Playwright green; tsc and eslint clean. Checked desktop +
375px. Both OG images rendered and reviewed.

### Deployed
Live at https://dday-six.vercel.app: `VOTER_SALT` set, and all routes plus both
OG images return 200. The preview image URLs resolve to the dday-six domain.

### Next
- Two e2e leftovers ("E2E Add Site…", "E2E Duplicate…") sit in the live
  queue: local and prod share one DB. Give e2e its own Neon branch.
- Set `NEXT_PUBLIC_SITE_URL` if a custom domain is added.
- Real iPhone Safari check of the geolocation prompt.

---

## 2026-09-22 (session 5) — make it inviting, not a SCADA panel

Feedback was that the site read as serious and boring — a newcomer would
"see and leave". The apparatus was fine; the greeting, palette and voice
were the problem. See `tasks/design.md` for the full rationale.

### Done
- **Welcome card** (`components/intro/WelcomeCard.tsx` + `useWelcome`):
  shown once per browser, tells the joke outright, invites the visitor in.
  The map previously opened on a grid of numbers with no explanation.
  Punchline is a rubber stamp of the handled %, not a big-number hero.
- **Repalette**: grey-sage → manila stock + risograph inks. New `--pop`
  (hot pink) reserved for invitations only — never for data.
- **Archivo Black** added as `.wordmark` / `.poster` for headlines.
- **Voice pass**: "Energized/Offline" → "Still humming/Handled",
  "Awaiting review" → "Up for debate", legend and empty states rewritten.
  Header carries a tagline. Vocabulary list is in `design.md`.
- **`useStats` extracted** from `StatsBar`; `MapView` owns the fetch and
  passes the reading down, so the welcome card and the bar agree. It now
  reports `loaded`, so the card waits rather than saying "around 0".
- **Fixed a real dark-mode bug** (pre-existing): `ThemeProvider`'s write
  effect ran with the initial `"light"` before the stored value was read
  back, and under StrictMode's double-mount that clobbered a saved
  preference. Toggling to dark then reloading put you back in light. The
  write is now gated on a `restored` flag.
- e2e updated for the new strings; `gotoMap` seeds `ai-dday-welcomed` so
  specs don't open on the overlay.

### Note for next session
`npm test` is flaky **when run repeatedly inside ten minutes** — site
creation is capped at 5 per 10 min per client, so a different API spec
times out on each rerun. Individually they pass. Not a code problem; wait
out the window or give the suite its own rate-limit bucket.

---

## 2026-09-22 (session 4) — 24h review window + share-based display

### Done
- **`sites.voting_ends_at`** (migration `0002`, backfilled from
  `created_at + 24h` so entries already in the queue don't get their clock
  restarted). Promotion now requires `net >= +3` **and** a closed window.
  Rejection is unchanged and still immediate — see the open question below.
- **`settleDueSites()`** (`src/lib/db/queries/settle.ts`), called by
  `GET /api/sites` before reading. Without it, an entry that hit +3 early
  and then went quiet would never promote: the vote statement is the only
  other thing that evaluates the rule, and it only sees the site being
  voted on.
- **Claim edits restart the window**, so a placeholder can't sit out its
  24h and then have the real claim swapped in.
- **No raw counts in the UI.** New `VoteShare` renders confirm/dispute as
  percentages; `VoteControls` shows a countdown and a state sentence.
  `votesToApproval`/`votesToRejection` deleted — they existed only to print
  "2 more confirmations". Copy updated on `/guide` and the submit dialog.
- New: `confirmShare`, `consensusState`, window helpers in
  `lib/config/moderation.ts`; `lib/format/countdown.ts`; `useNow`.

### Open question for next session
The window gates **promotion only** — I read "and then it will be added
and make it minimum 24hrs voting" as tying the clock to addition, and
letting obvious spam clear the queue fast. If disputes should also wait
out the window, it's one clause in the vote statement's CASE plus the
mirror of `settleDueSites`.

### Verified
93 Vitest + 8 Playwright green; `tsc --noEmit` and eslint clean. Checked
in-browser: empty / 100% / 80% splits, countdown, both themes.

### Docs
`tasks/review-window.md` is new (moderation.md was over the 150-line cap).
Also updated: `moderation.md`, `api.md`, `CLAUDE.md`, `README.md`.

---

## 2026-09-22 (session 2) — Community voting + seeded data + redesign

Condensed: the mechanics below all have a reference doc now, so only what
a future session still has to act on is kept here.

- Built the whole voting layer (`site_votes`, thresholds, one-statement
  vote, no DELETE endpoint, duplicate guard) → [moderation.md](moderation.md)
  and [api.md](api.md).
- Seeded 83 sourced `locked` reference sites → [seed-data.md](seed-data.md).
- Redesigned off the generic "military stencil" look onto a grid
  operator's dispatch console → [design.md](design.md).
- Six real bugs fixed, including the world-copy longitude wrap and the
  modal's z-index → [architecture.md](architecture.md).

### Still not done
- **Not deployed.** Production runs the pre-voting build. Order matters:
  set `VOTER_SALT` in Vercel → `npm run db:migrate` against prod →
  `npm run db:seed` against prod → deploy. Migration `0002` is now part of
  that too.
- PostHog still skipped (setup error hit two sessions ago).
- No real-device iPhone Safari check.
- `/queue` has no pagination — it caps at 200 pending rows.
- `/queue`'s `LocationPreview` still uses OSM's iframe, so it keeps
  local-script labels while the main map is English.

### Reference docs (this directory)
`architecture.md` · `moderation.md` · `review-window.md` · `api.md` ·
`seed-data.md` · `testing.md` · `deployment.md` · `design.md`. This file
stays a session log — durable reference material belongs in those.

Full design doc: `/Users/vishal/.claude/plans/ok-my-plan-is-stateless-yeti.md`
