# API reference

All routes are Node runtime. All writes are Zod-validated and
rate-limited. There is **no DELETE endpoint** — see
[moderation.md](moderation.md).

## `GET /api/sites`

| Query | Values | Default |
|---|---|---|
| `moderation` | `approved` \| `pending` \| `rejected` | `approved` |

Headers: `x-voter-id` (optional) — returns this voter's existing ballots
so the UI renders in its already-voted state on first paint.

```json
{
  "sites": [ { "id": "...", "name": "Ashburn — Data Center Alley", "lat": 39.0438,
               "lng": -77.4874, "approxCount": 120, "operator": "...",
               "notes": "...", "sourceUrl": "https://...",
               "status": "active", "moderation": "approved",
               "upvotes": 0, "downvotes": 0, "locked": true,
               "votingEndsAt": "...",
               "createdAt": "...", "updatedAt": "..." } ],
  "myVotes": { "<siteId>": 1 }
}
```

`approved` caps at 5000 rows; `pending` caps at 200, newest first (a stale
entry nobody will confirm shouldn't sit at the top of the queue forever).

This route runs `settleDueSites()` **before** reading. Promotion is gated
on the review window having closed, and the vote statement can only act on
the site being voted on — so an entry that cleared the threshold early and
then went quiet is promoted here instead. See [moderation.md](moderation.md).

`upvotes` / `downvotes` are still returned; the UI renders them only as a
percentage share. Don't reintroduce raw counts in the interface.

`400` on an unrecognised `moderation` value.

## `POST /api/sites`

Creates a **pending** submission. Rate limit: 5 / 10 min per IP.

```json
{ "name": "string (1-120)", "lat": -90..90, "lng": -180..180,
  "approxCount": 1..100000, "operator": "string (≤120, optional)",
  "notes": "string (≤1000, optional)",
  "sourceUrl": "http(s) URL (≤500, optional)" }
```

`sourceUrl` accepts only `http://` or `https://`. `javascript:` and
`data:` are rejected — the value is rendered into an anchor's `href`.

| Status | Meaning |
|---|---|
| `201` | Created, `{ site }`, always `moderation: "pending"` |
| `400` | Invalid JSON or failed validation (`{ error, details }`) |
| `409` | A non-rejected site already exists within ~5km (`{ error, existingSite }`) |
| `429` | Rate limited |

## `GET /api/sites/[id]`

`200 { site }` · `400` malformed UUID · `404` not found.

## `PATCH /api/sites/[id]`

Partial update; at least one field required. Rate limit: 10 / 10 min.

Accepts any create field plus `status` (`active` | `neutralized`).

```json
{ "site": { ... }, "returnedToReview": true }
```

`returnedToReview` is `true` when a **claim field** changed (name, lat,
lng, approxCount, operator, notes, sourceUrl). That resets the entry to
`pending` and zeroes its votes. Changing only `status` does not.

| Status | Meaning |
|---|---|
| `200` | Updated |
| `400` | Malformed id, invalid JSON, failed validation, or empty payload |
| `403` | Claim edit attempted on a `locked` reference site |
| `404` | Not found |
| `429` | Rate limited |

A locked site still accepts a `status`-only PATCH.

## `POST /api/sites/[id]/vote`

Rate limit: 60 / 10 min per IP.

Headers: `x-voter-id` — the browser's random token. Hashed server-side
with the request IP and `VOTER_SALT`.

```json
{ "value": 1 }    // or -1
```

```json
{ "site": { ... }, "myVote": 1, "promoted": false, "rejected": false }
```

- `promoted` / `rejected` are `true` only on the vote that actually
  **changed** the state, so the UI can celebrate the exact moment rather
  than discovering it on the next refetch.
- A vote that takes an entry past the approval threshold **before** its
  `votingEndsAt` returns `promoted: false` and leaves it `pending`.
  Rejection is not gated this way and still fires immediately.
- Re-voting overwrites the voter's previous ballot; it never stacks.
- `site` carries the server-recomputed tally — never derive it client-side.

| Status | Meaning |
|---|---|
| `200` | Recorded |
| `400` | Malformed id, invalid JSON, or `value` not exactly `1` / `-1` |
| `404` | Not found |
| `429` | Rate limited |

## `GET /api/stats`

```json
{ "totalSites": 83, "totalApproxDatacenters": 985,
  "activeCount": 83, "neutralizedCount": 0,
  "pendingCount": 2, "votesCast": 5 }
```

Headline aggregates count **approved sites only**. Counting unreviewed
submissions would let one spammer inflate the front page, which is exactly
what the queue exists to prevent. `pendingCount` is reported separately as
a call to action; `rejected` rows are excluded entirely.

## Error shape

```json
{ "error": "Human-readable message", "details": { } }
```

`details` appears on Zod failures only. Messages are written for the
person reading them in the UI, not for a log.
