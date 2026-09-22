@AGENTS.md

# AI D-Day — Community Datacenter Map

Satirical dark-humor "survival guide" site: a world map of datacenter sites
(approximate counts, not exact). Open, live-shared data — no auth, no admin.

**Moderation is by community vote, not by deletion.** Submissions start
`pending` and are hidden from the map; the review queue (`/queue`) is where
people confirm or dispute them. −3 net discards a site immediately; +3 net
puts it on the map, but **only once its 24h review window has closed**.
There is deliberately **no delete endpoint**. Editing an approved site's
claim fields resets it to `pending`, clears its votes and restarts the
window.

The UI never renders raw vote counts or the thresholds — only the
confirm/dispute split as a percentage and a countdown. Keep it that way.

83 seeded reference sites (`src/lib/seed/`) are inserted `locked` — they
carry a source URL, can't be edited, and can't be voted off. They're the
anchor set that keeps the map useful if voting is brigaded.

Voter identity is `sha256(VOTER_SALT + browser token + IP)`; neither the
token nor the IP is stored. Not airtight, documented as such on `/guide`.

Full design doc: `/Users/vishal/.claude/plans/ok-my-plan-is-stateless-yeti.md`
Session continuity: `tasks/state.md` — update at the end of every session.

Reference docs (all in `tasks/`, all capped at 150 lines):
`architecture.md`, `moderation.md`, `review-window.md`, `api.md`,
`seed-data.md`, `testing.md`, `deployment.md`, `design.md`, `sharing.md`. Read the
relevant one before changing that area, and update it when the behaviour
changes.

## Stack
- Next.js App Router (TS), Node runtime — no Edge
- Map: react-leaflet + Leaflet, Esri World Street Map tiles (keyless,
  English labels worldwide)
- DB: Postgres via Vercel Marketplace (Neon) + Drizzle ORM
- Rate limiting: Upstash Redis (`@upstash/ratelimit`)
- Validation: Zod, shared between client forms and API routes
- Styling: Tailwind, neo-brutalist tokens (hard shadows, thick borders)
- Tests: Vitest (unit/API), Playwright (smoke e2e)

## Conventions (see ~/.claude/rules/common/ for full global rules)
- Immutable data patterns — never mutate in place.
- Many small files: 200–400 lines typical, 800 max.
- Validate all input at API boundaries with Zod; never trust client data.
- Dark mode: localStorage preference, **light is default**, ignore
  `prefers-color-scheme`.
- Neo-brutalist UI: `5px 5px 0` hard shadows, `2px solid` borders, no blur.
- **Markdown files: max 150 lines each.** Split into multiple files instead
  of letting one grow past that.
- Never commit `.env*` files — env vars set via Vercel dashboard/CLI only.
- Work reports/docs for humans: `.docx`, not `.md` (use `docx-work-report`
  skill). `.md` files here are for Claude/dev continuity only.

## Commands
- `npm run dev` — local dev server
- `npm test` — Vitest unit + integration tests
- `npm run test:e2e` — Playwright smoke tests
- `npm run db:generate` / `npm run db:migrate` — DB migrations
- `npm run db:seed` — insert/refresh the locked reference sites (idempotent)

## End of session
Run the `session-handoff` skill (or update `tasks/state.md` manually) with:
what was done, what's next, any blockers. Keep it under 150 lines — trim
stale entries rather than letting it grow unbounded.
