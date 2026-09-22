# Testing

75 Vitest + 7 Playwright, all passing. Target is 80% coverage.

```bash
npm test          # Vitest unit + integration
npm run test:e2e  # Playwright
```

**Both hit the real dev Neon and Upstash instances.** There is no separate
test branch yet. Tests clean up their own rows.

## Vitest layout

| Suite | Covers |
|---|---|
| `src/lib/config/__tests__/moderation.test.ts` | Threshold arithmetic, neutral band |
| `src/lib/__tests__/voter.test.ts` | Voter-key hashing: stability, separation, no leakage |
| `src/lib/__tests__/sanitize.test.ts` | HTML stripping |
| `src/lib/__tests__/rate-limit.test.ts` | Limiter construction |
| `src/lib/validation/__tests__/` | Zod schemas incl. `javascript:` URL rejection |
| `src/app/api/**/__tests__/` | Route integration against the live dev DB |

Vote-route tests cover the behaviour that's easy to get wrong: promotion
at threshold, rejection at threshold, one ballot per voter, vote
switching, locked-site immunity, and sticky approval.

`fileParallelism: false` — integration tests share one live DB with no
per-test isolation, so files must not race each other.

## Test-only helpers

`src/test-utils/db.ts`:

- `deleteSiteForTest(id)` — the app has **no** delete path, so teardown
  lives here rather than in the production query layer.
- `uniqueTestCoords()` — coordinates spaced far enough apart to clear the
  ~5km duplicate guard, so tests that each create a site don't collide.

`src/test-utils/request.ts`:

- `uniqueTestIp()` — a fresh rate-limit bucket per call, so tests don't
  exhaust each other's windows in the shared dev Redis.

## Playwright specs

| Spec | Covers |
|---|---|
| `add-site.spec.ts` | Submission lands in the queue, not the map; duplicate refusal |
| `review-queue.spec.ts` | Vote-to-promotion (pin appears), vote-to-discard |
| `site-detail.spec.ts` | Locked-site behaviour; **no delete control exists** |

`globalSetup` clears community rows only
(`DELETE FROM sites WHERE locked = false`) — wiping the seeded set would
empty the map and force a re-seed before every run.

## Non-obvious e2e constraints

Each of these caused a real failure. Don't undo them.

**Per-run rate-limit buckets.** `rateLimitBucket(label)` in `e2e/helpers.ts`
returns a header with a fresh UUID. Creates are capped at 5 per 10 minutes
per client; a fixed key makes the *second* run inside that window fail
with 429s that look like product bugs.

**Click points must be on the right side of the map.** The legend and the
add-mode hint sit bottom-left and intercept pointer events. `OCEAN_POINTS`
holds four vetted spots that are in open South Pacific, clear of all 83
seeded sites, and far enough apart from each other.

**Assert markers by title, never by count.**

```ts
page.locator(`.leaflet-marker-icon[title="${siteName}"]`)
```

Total counts are shared state that other specs and leftover rows shift
underneath you.

**`gotoMap()` waits for the first marker,** not just the container.
Markers render a tick later, so a baseline measured too early reads 0 and
gets compared against a fully-drawn map.

**Target an isolated seeded site for detail tests.** At world zoom many
campuses overlap and a neighbour intercepts the click. `site-detail.spec.ts`
uses Nairobi — no seeded site within ~25°.

**A browser can only ever be one voter.** Token + IP is the identity, so
reaching a threshold through the UI alone is impossible by design.
`voteAsOthers()` casts the earlier ballots straight at the API with
distinct headers, then the UI casts the deciding one.

## When a test fails

1. Read `test-results/<spec>/error-context.md` — it contains the full
   accessibility snapshot of the page at failure, which usually names the
   cause outright (a 429 banner, a validation error, an intercepting
   element).
2. `npx playwright show-trace test-results/<spec>/trace.zip` for the rest.
3. Check whether it's the product or the harness. Of the failures during
   the voting build-out, two were genuine product bugs (out-of-range
   longitude, modal behind the map) and the rest were test setup.
