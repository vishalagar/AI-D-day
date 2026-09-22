# Contributing

## Setup

```bash
npm install
npx vercel link && npx vercel env pull
npm run db:migrate && npm run db:seed
npm run dev
```

Add `VOTER_SALT` to `.env.local` (`openssl rand -hex 32`).

## Before you open a PR

```bash
npm run lint
npx tsc --noEmit
npm test
npm run test:e2e
npm run build
```

All five must pass. Tests hit the **live dev Neon and Upstash instances** —
there's no test branch yet, so don't run them from two places at once.

## Design decisions that aren't up for casual revision

These have reasons behind them. Change them by all means, but argue the
trade-off first rather than treating them as oversights.

**No delete endpoint.** Discarding an entry is the community's call, made
by downvote. One annoyed visitor should not be able to erase a record. The
only delete in the repo is `src/test-utils/db.ts`, and it stays there.

**No auth.** Open, anonymous read/write is the point of the project, not a
gap in it. Voter identity is a hash, not an account.

**Locked reference sites can't be edited or voted off.** They're the
anchor that keeps the map useful under brigading.

**Light mode is the default and `prefers-color-scheme` is ignored.**
Deliberate.

**The modal sits at `z-[2000]`.** Leaflet's panes occupy 200–1000 in the
same stacking context. Lowering it puts modals behind the map tiles.

**`suppressHydrationWarning` on `<html>`.** Required, not cosmetic — the
pre-paint theme script legitimately diverges from the server render.

## Code conventions

Full rules in `CLAUDE.md`. The load-bearing ones:

- **Immutable data.** Return new objects; never mutate in place.
- **Many small files.** 200–400 lines typical, 800 max. Split by feature.
- **Validate at the boundary.** Every API route parses input with a Zod
  schema from `src/lib/validation/`, shared with the client form.
- **No magic numbers.** Thresholds live in `src/lib/config/moderation.ts`.
- **All SQL lives in `src/lib/db/queries/`.** Routes stay thin.
- **Never swallow an error.** If a form can't render a field's error,
  surface it somewhere — a silently dead button already shipped once.
- **Markdown caps at 150 lines** per file, and developer markdown goes in
  `tasks/`. Human-facing reports are `.docx`, not `.md`.

## Commit messages

```
<type>: <description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

Never commit `.env*`. Never add Claude as a contributor.

## Adding a seeded site

See [tasks/seed-data.md](tasks/seed-data.md). Short version: pick the
regional file, keep it ≥5km from every existing entry, include a real
`sourceUrl`, re-run `npm run db:seed`. Don't add a row you can't cite.

## Writing tests

Read [tasks/testing.md](tasks/testing.md) before touching the e2e suite —
it documents several constraints that each caused a real failure
(per-run rate-limit buckets, click points that dodge the bottom-left
overlays, asserting markers by title rather than count).

For API work, cover the state transitions rather than just the happy path:
threshold crossings, one-ballot-per-voter, vote switching, locked-site
immunity.

## Changing the UI

Read [tasks/design.md](tasks/design.md) first. The short version: one
family (Archivo) plus mono for numbers only, electrical-schematic signal
colours, one orchestrated motion moment. Avoid all-caps eyebrow labels,
numbered markers on non-sequences, and `→` in button text — the previous
design accumulated all three and read as machine-generated.
