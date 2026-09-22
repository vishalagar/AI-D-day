# Community moderation

The only spam control. No accounts, no admin, no delete endpoint.

## States

`sites.moderation` is an enum: `pending`, `approved`, `rejected`.

| State | On the map? | In the queue? |
|---|---|---|
| `pending` | No | Yes |
| `approved` | Yes | No |
| `rejected` | No | No |

A separate `sites.status` (`active` / `neutralized`) is the satire game
mechanic — "still running" vs "handled, allegedly". It is **not**
moderation and never affects visibility.

## Thresholds

Defined in `src/lib/config/moderation.ts`, never inlined:

```
APPROVE_THRESHOLD = 3     // net votes to reach the map
REJECT_THRESHOLD  = -3    // net votes to be discarded
```

Deliberately low. The site is a joke with a real map underneath, and a
queue nobody can clear isn't fun. Raise them if brigading becomes real.

**The thresholds are never rendered.** The UI shows the split of opinion
as a percentage (`confirmShare`) and a countdown, never "1 more vote" —
that framing turns reviewing into a race to cast the deciding ballot and
makes a three-vote entry read as settled fact. `upvotes`/`downvotes` stay
in the API response; keep them out of the interface.

## The review window

A submission cannot be promoted for 24 hours after it is logged, however
fast it clears the threshold — and a second mechanism promotes entries
whose window closed while nobody was voting. Both live in
[review-window.md](review-window.md).

## Transition rules

Applied in priority order, inside the vote statement:

1. **Locked rows never change moderation state at all.**
2. `net <= REJECT_THRESHOLD` → `rejected`
3. `net >= APPROVE_THRESHOLD` **and `voting_ends_at <= now()`** → `approved`
4. Already `approved` → stays `approved`
5. Otherwise → `pending`

Rule 4 makes promotion **sticky**: once the community has put a site on
the map, a couple of late downvotes can't quietly pull it back off. Only a
full push to −3 removes it. Rule 2 outranks rule 4, so a genuinely
disputed site can still be discarded.

Rejection is not permanent — a rejected site whose net climbs back above
−3 returns to `pending`.

## Why the vote is one SQL statement

`src/lib/db/queries/votes.ts` does the upsert, the recount and the state
transition in a single statement. Two reasons:

- **The Neon HTTP driver has no transactions.** Two round-trips could
  interleave with a concurrent voter and persist a stale count.
- **The tally is recomputed from `site_votes`, not incremented.** Even if
  an update is lost, the next vote recomputes from the source of truth, so
  counters self-heal instead of drifting permanently.

One subtlety is load-bearing: the tally reads
`existing votes (excluding this voter) UNION ALL the incoming vote`.
All CTEs in a statement see the snapshot from the statement's start, so a
plain `count(*)` over `site_votes` would miss the row the upsert CTE is
inserting right now.

## Voter identity

There are no accounts. Identity is:

```
sha256(VOTER_SALT + browser_token + request_ip)  → first 64 hex chars
```

- `browser_token` is a random UUID the client generates once and keeps in
  `localStorage` (`src/hooks/use-voter.ts`), sent as `x-voter-id`.
- Neither the token nor the IP is stored — only the hash.
- A unique index on `(site_id, voter_key)` enforces one ballot per voter.
  Re-voting overwrites the previous row, so people can change their mind.
- Malformed or missing tokens all bucket to the same `anonymous` key
  rather than minting a fresh voter per request.

Binding the token to the IP means clearing `localStorage` alone doesn't
buy a second vote. **This is not airtight** — anyone with a VPN can vote
twice. Without accounts that's the ceiling, and `/guide` says so plainly
rather than implying more rigour than exists.

`VOTER_SALT` must be set in production. The fallback is a known constant,
which would let someone precompute voter keys.

## Editing

Editing the fields that describe *what the site is* — name, lat, lng,
approxCount, operator, notes, sourceUrl — resets the entry to `pending`,
clears its votes and **restarts the review window**. Ballots cast against
the old claim must not carry over to a new one, and inheriting the old
deadline would let someone run out 24 hours on a placeholder and then swap
in the real claim with the review period already spent.

Flipping `status` does not reset anything: it doesn't change the claim.

Locked (seeded) rows reject claim edits with `403` but still allow the
status toggle.

## Locked reference sites

Seeded rows are inserted `locked: true, moderation: 'approved'`. They
collect votes (the tally is shown) but can never be edited or voted off.

They are the anchor set: if voting goes sideways, the map still shows 83
sourced datacenter campuses. See [seed-data.md](seed-data.md).

## Duplicate guard

A new site within ~0.05° (~5km) of any existing non-rejected entry is
refused with `409` and the existing site's name. Without it the review
queue fills with five copies of Ashburn and reviewers stop bothering.

## Rate limits

Per client (IP), sliding window, in `src/lib/rate-limit.ts`:

| Action | Limit |
|---|---|
| Create | 5 / 10 min |
| Update | 10 / 10 min |
| Vote | 60 / 10 min |

Voting is the thing we *want* people doing, and a reviewer clearing the
queue in one sitting is a good actor. Ballot stuffing is handled by the
per-voter unique index, not by throttling.
