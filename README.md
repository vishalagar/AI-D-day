# AI D-Day — Community Datacenter Map

A satirical, community-reviewed "survival guide" for a fictional AI
takeover. The map shows datacenter sites with **approximate** counts —
nobody has a real census — and anyone can submit one.

Live: https://dday-six.vercel.app

**This is fiction.** Coordinates are approximate and drawn from material
that was already public. Not intelligence, not a target list. See
`/guide` for the in-app disclaimer.

## How it works

There is no login and no admin. Moderation is by community vote:

1. Anyone submits a site. It starts **pending** and is hidden from the map.
2. Visitors confirm or dispute it in the **review queue** (`/queue`).
3. Review stays open for **24 hours minimum**, however fast it gets
   confirmed — three people agreeing in the first minute is whoever
   happened to be on the queue page, not the community.
4. When the window closes, an entry that's **+3 net** ahead goes on the
   map. **−3 net** discards it, and that one doesn't wait.

Reviewers see the split of opinion as a percentage and a countdown, never
a running tally — showing "1 more vote" turns reviewing into a race to
cast the deciding ballot.

There is deliberately **no delete endpoint** — the only way off the map is
a community downvote. 83 seeded reference sites are `locked`: each carries
a public source URL, and they can't be edited or voted off, so the map
stays useful even if voting is brigaded.

Details: [tasks/moderation.md](tasks/moderation.md) and
[tasks/review-window.md](tasks/review-window.md).

## Stack

- Next.js (App Router, TypeScript), Tailwind CSS, Node runtime — no Edge
- Map: `react-leaflet` + Esri World Street Map tiles — keyless, and
  labelled in English worldwide (CSS-filter dark mode, no second provider)
- DB: Postgres via Vercel Marketplace (Neon) + Drizzle ORM
- Rate limiting: Upstash Redis (`@upstash/ratelimit`)
- Validation: Zod, shared between client forms and API routes
- Tests: Vitest (unit + integration against the dev DB), Playwright (e2e)

## Getting started

```bash
npm install
npx vercel link        # first time only, links this repo to the Vercel project
npx vercel env pull    # pulls DATABASE_URL / KV_REST_API_* into .env.local
npm run db:migrate     # apply migrations
npm run db:seed        # insert the 83 locked reference sites
npm run dev
```

Open http://localhost:3000. Also set `VOTER_SALT` in `.env.local` — see
[tasks/deployment.md](tasks/deployment.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm test` | Vitest unit + integration tests (hits the live dev DB) |
| `npm run test:e2e` | Playwright e2e (clears community rows, keeps seeded ones) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a Drizzle migration from `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Insert/refresh the locked reference sites (idempotent) |

## Documentation

Reference docs live in `tasks/` alongside the session log — this repo
keeps all developer markdown there.

| Doc | Covers |
|---|---|
| [tasks/architecture.md](tasks/architecture.md) | Layout, data flow, why the pieces are where they are |
| [tasks/moderation.md](tasks/moderation.md) | Voting rules, thresholds, voter identity |
| [tasks/api.md](tasks/api.md) | Endpoint reference |
| [tasks/seed-data.md](tasks/seed-data.md) | The reference dataset and how to extend it |
| [tasks/testing.md](tasks/testing.md) | Test layout and the non-obvious e2e constraints |
| [tasks/deployment.md](tasks/deployment.md) | Launch order and the pre-deploy checklist |
| [tasks/design.md](tasks/design.md) | Visual direction and the tokens behind it |
| [tasks/state.md](tasks/state.md) | Session history and current blockers |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to work on this repo |
| `CLAUDE.md` | Conventions for AI assistants |

## Notes for contributors

- Data is open and anonymous by design — validate everything server-side
  and never trust client input.
- Don't reintroduce a delete path. Discarding an entry is the community's
  call; a single annoyed visitor shouldn't be able to erase a record.
- `npm test` and `npm run test:e2e` hit the **real dev Neon/Upstash
  instances** (no separate test branch yet). Tests clean up their own rows.
- Markdown files here are for developer continuity and are capped at 150
  lines each. Human-facing reports go out as `.docx`.
