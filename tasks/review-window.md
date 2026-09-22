# The review window

The time gate on promotion. Companion to
[moderation.md](moderation.md), which covers thresholds, states and voter
identity.

## The rule

Every submission carries `sites.voting_ends_at`, set to 24 hours
(`VOTING_WINDOW_HOURS`, `src/lib/config/moderation.ts`) after it was
logged. **A pending entry cannot be promoted before that instant, however
fast it clears the threshold.**

Three confirmations inside a minute is whoever happened to be on the queue
page — and one person with a phone, a laptop and a VPN can be all three.
The window makes an entry survive a day of anyone who cares being able to
look at it. It's the only defence that doesn't depend on voter identity
being trustworthy, which it isn't (see moderation.md).

It gates **promotion only**. Rejection stays immediate: a queue clogged
with junk is what stops people reviewing the real entries.

The deadline is stored rather than derived from `created_at`, so changing
the window length never retroactively moves entries already in review, and
a claim edit can restart the clock — which it does, for the reason in
moderation.md's *Editing* section.

## Settling

Promotion normally happens inside the vote statement, which only ever sees
the site being voted on. An entry that reaches +3 in its first hour and
then gets no further votes would sit `pending` forever: its window closes
with nothing running to notice.

`settleDueSites()` (`src/lib/db/queries/settle.ts`) is the other half —
one statement promoting every pending, unlocked row whose window has
closed while already at or above the threshold. `GET /api/sites` calls it
before reading, so the settle lands before the queue is rendered.

Deliberately on-read rather than on a cron: there is no scheduler, no
queue and no admin in this project, and a board nobody is looking at
doesn't need settling. If traffic ever makes the extra write per read
matter, move it to a Vercel cron and drop the call.

## What the UI shows

Never a count, never a threshold. `VoteShare` renders the confirm/dispute
split as percentages, and `VoteControls` renders the countdown plus one of
two states:

| Window | Net | Copy |
|---|---|---|
| open | `>= APPROVE_THRESHOLD` | "On course for the map if the split holds." |
| open | below | "Not enough agreement to add it yet." |
| closed | `>= APPROVE_THRESHOLD` | "Headed for the map." |
| closed | below | "Closed without enough agreement. Stays here until opinion shifts." |

A pending entry whose window closed under the threshold is not rejected —
it stays in the queue and can still be promoted later, whenever the tally
gets there.

## Testing it

Nothing waits 24 hours. Both suites backdate the column instead:

- Vitest: `closeVotingWindowForTest(id)` in `src/test-utils/db.ts`
- Playwright: `closeReviewWindow(id)` in `e2e/helpers.ts`, raw SQL like
  `global-setup`

There is deliberately **no HTTP route** that closes a window — it would be
a way to skip review entirely.
