# Deployment

Production: https://dday-six.vercel.app

> **Current state (2026-09-23): production is current** — voting, seeded
> sites, redesign and the "How close is the nearest AI?" share hook are live.
> `VOTER_SALT` is set (Production, stored as a Vercel Secret). Note: local dev
> and production share **one** Neon database, so e2e runs write to prod.

## Environment variables

Set in the Vercel dashboard. Never committed — `.env*` is gitignored.

| Variable | Source | Notes |
|---|---|---|
| `DATABASE_URL` | Neon Marketplace integration | Auto-provisioned |
| `KV_REST_API_URL` | Upstash Marketplace integration | Note the `KV_` prefix, not `UPSTASH_` |
| `KV_REST_API_TOKEN` | Upstash Marketplace integration | |
| `VOTER_SALT` | **Set manually** | `openssl rand -hex 32` |

`VOTER_SALT` is the one that needs attention. The code falls back to a
known constant if it's unset, which would let anyone precompute voter keys
and check whether a given IP voted on a given site. Set it **before** the
first deploy that includes voting — changing it later invalidates every
existing ballot, since voter keys are derived from it.

Pull locally with `npx vercel env pull`.

## Release order

The order matters. The app queries columns that must already exist, and
the migration backfills rows that the seed then updates.

```bash
# 1. Set VOTER_SALT in the Vercel dashboard (do this first)

# 2. Migrate production
npm run db:migrate

# 3. Seed the locked reference sites (idempotent)
npm run db:seed

# 4. Deploy
npx vercel --prod
```

Both `db:migrate` and `db:seed` read `DATABASE_URL` from `.env.local`, so
point that at production for steps 2–3, or export the prod URL inline.

Deploying before migrating gives 500s on every route: the queries
reference `moderation`, `upvotes`, `downvotes`, `locked` and `source_url`.

## What migration 0001 does

Adds the moderation columns and the `site_votes` table, then:

```sql
UPDATE "sites" SET "moderation" = 'approved' WHERE "created_at" < now();
```

Without that backfill, every row already on the map would inherit the
`pending` default and silently vanish. Grandfathering them in is
deliberate — they were visible before, so they stay visible.

## Pre-launch checklist

- [ ] `VOTER_SALT` set in Vercel
- [ ] `npm run db:migrate` applied to production
- [ ] `npm run db:seed` run against production (expect 83 inserted)
- [ ] `npm test` and `npm run test:e2e` green
- [ ] `npm run build` clean
- [ ] Security: no hardcoded secrets, all writes Zod-validated and
      rate-limited, no route exposes data without validation
- [ ] Analytics: Vercel Speed Insights is wired. **PostHog still missing**
      — setup errored out and was deferred
- [ ] iPhone Safari on a real device. **Not yet done.** No file uploads,
      so no HEIC concern, but the map, the review deck and the bottom-left
      overlays need a real check
- [ ] Confirm `/api/stats` and `/` return 200 publicly after deploy

## Known open items

- **PostHog product analytics** — blocked on a setup error last session.
  Only Speed Insights is live.
- **No real-device mobile check.**
- **No moderation escape hatch.** If someone mass-submits, rate limiting
  plus the duplicate guard is the whole defence. There is no admin and, by
  design, no delete. Raising `APPROVE_THRESHOLD` is the lever.
- **`/queue` has no pagination** — it caps at 200 pending rows.
- **Tests run against the live dev DB.** A dedicated Neon test branch
  would be the right fix.

## Rollback

`npx vercel rollback` reverts the deployment. It does **not** revert the
migration — but 0001 is purely additive, so the previous build keeps
working against the migrated schema (it just ignores the new columns).
Don't write a down-migration that drops them unless you also plan to
redeploy the old build.
