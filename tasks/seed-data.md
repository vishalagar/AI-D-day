# Seed data — the reference set

83 hand-curated datacenter campuses, inserted `locked: true` and
`moderation: 'approved'`.

## Why it exists

Two jobs:

1. **An empty map reads as a broken demo.** A first visitor should see a
   world already covered in real sites, not a blank ocean.
2. **An anchor the vote can't erase.** If voting is ever brigaded, the map
   still shows 83 sourced campuses. Locked rows collect votes (the tally
   is displayed) but their moderation state never changes, and claim edits
   are refused with `403`.

## Where it lives

| File | Rows |
|---|---|
| `src/lib/seed/americas.ts` | 39 — US, Canada, Brazil, Mexico, Chile |
| `src/lib/seed/europe.ts` | 20 — Ireland, Nordics, Benelux, DACH, southern Europe |
| `src/lib/seed/asia-pacific.ts` | 24 — APAC plus Middle East and Africa |
| `src/lib/seed/types.ts` | `SeedSite` shape and the shared `SOURCES` map |
| `src/lib/seed/index.ts` | Concatenates into `SEED_SITES` |

Split by region to stay inside the repo's 200–400 line file convention.

## Sources

Every row carries a `sourceUrl`. Most point at operators' own datacenter
location pages, collected in `SOURCES`:

- Google — `google.com/about/datacenters/locations/`
- Meta — `datacenters.atmeta.com`
- Microsoft — `datacenters.microsoft.com/globe/explore`
- AWS — `aws.amazon.com/about-aws/global-infrastructure/regions_az/`
- Oracle, Apple — public infrastructure pages

Multi-operator clusters (Ashburn, Frankfurt, Santa Clara, Singapore) cite
Wikipedia instead, since no single operator page describes them.

## About the numbers

`approxCount` is the number of datacenter **buildings or halls** publicly
reported at a campus. It is deliberately approximate and matches the rest
of the app's framing:

- Operators rarely publish exact counts.
- The figure changes constantly as new phases come online.
- Metro-level entries (Ashburn ≈ 120, Frankfurt ≈ 45) aggregate many
  operators across a corridor, not one campus.

Coordinates are campus- or metro-centre, rounded to 4 decimals. They are
not precise facility locations and are not meant to be.

## Running the seed

```bash
npm run db:seed
```

Idempotent. Matching is on `(name, locked=true)`:

- Existing locked row → updated in place
- No match → inserted

Community submissions are **never** touched, even if a name collides.
Correcting the dataset is therefore just: edit the TS file, re-run.

The e2e `globalSetup` deliberately spares locked rows
(`DELETE FROM sites WHERE locked = false`) so test runs don't wipe the set
and force a re-seed every time.

## Adding a site

1. Pick the regional file.
2. Add a `SeedSite`: `name`, `lat`, `lng`, `approxCount`, `operator`,
   `notes`, `sourceUrl`.
3. Keep it **≥5km from every existing entry** — the duplicate guard uses
   ~0.05°, and two closer pins overlap at any usable zoom anyway.
4. Write `notes` as one or two plain sentences of something actually
   interesting (Hamina's seawater cooling, Dublin's grid moratorium). They
   are the reason anyone clicks a second pin.
5. `npm run db:seed`.

Don't add a row you can't cite. The whole point of the locked set is that
it's checkable.

## Regional bias

Coverage skews to the US and western Europe because that's where
operators publish locations. China, Russia and most of central Asia are
underrepresented — not an oversight, just an absence of public sources
that meet the citation bar. Community submissions are the intended route
for filling those gaps.
