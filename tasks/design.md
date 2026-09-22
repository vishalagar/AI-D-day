# Design direction

## The concept: a resistance war room run out of a garage

Datacenters are a power-grid story, so the interface keeps the apparatus
of a dispatch board — a load gauge, signal colours, a review *queue* the
way a control room has one. But the people running this board are not a
utility. They're volunteers with a map and strong opinions, and the humour
lives in that gap: very serious instrumentation, completely absurd stakes.

An earlier pass played the console straight — grey-sage drafting stock,
measured explanatory prose, no welcome. It was competent and completely
uninviting: a newcomer landed on a grid of numbers with no idea it was a
joke. The apparatus stayed; the palette, the voice and the way the site
greets a stranger were rebuilt around it. The neo-brutalist tokens from
`CLAUDE.md` (hard `5px 5px 0` shadows, `2px solid` borders, no blur) are
unchanged.

## Type

One family plus a poster weight plus one mono, each with a job:

- **Archivo** (400–700) — body and UI. A grotesque designed for
  high-performance signage, the right vernacular for a board.
- **Archivo Black** — the `.wordmark` and `.poster` classes: the wordmark
  and page headlines. Poster weight is where the page gets to shout, and
  it only shouts in those places.
- **IBM Plex Mono** — the `.figure` class, applied to **numbers only**.
  Tabular figures keep digits aligned on a readout that updates live. Mono
  on ordinary labels is decorative and was removed.

Avoided: all-caps eyebrow labels above headings, `01 / 02 / 03` markers on
content that isn't a sequence (the Field Manual's old "DIRECTIVE 1/2/3"),
and `→` appended to button text. The one all-caps element is the welcome
card's rubber stamp, where caps are what the object actually is.

## Colour

Signal colours follow electrical-schematic convention, so the map is
readable without the legend once you know the idiom.

Manila envelope stock and risograph inks — the palette of something run
off on a borrowed copier, not specified by a vendor.

| Token | Light | Dark | Means |
|---|---|---|---|
| `--paper` | `#ece0c6` | `#17130f` | Manila stock / garage at night |
| `--panel` | `#f8f1e1` | `#241d16` | Raised surfaces |
| `--ink` | `#1b1510` | `#f4e9d5` | Text |
| `--alert` | `#e03a10` | `#ff5c30` | Still humming |
| `--ok` | `#00875a` | `#2fd98f` | Handled |
| `--watch` | `#e09000` | `#ffc043` | Waiting on the queue |
| `--pop` | `#ff2d78` | `#ff4d92` | **Invitations only** |

`--pop` is the wink: the one colour on the board that reports no state.
It's reserved for "come in" moments (the welcome card's CTA, the route
back to the map from an empty queue) so it keeps that meaning. Manila is
deliberately yellower and dirtier than the `#F4F1EA`-ish cream that reads
as a generated-page tell.

## The hero: the welcome card

`src/components/intro/WelcomeCard.tsx`, shown once per browser
(`ai-dday-welcomed` in localStorage, via `useWelcome`). It is the only
place the joke is told outright, and without it the map opens on a grid of
numbers and a lot of red squares — which reads as a real incident board.

Its punchline is a **rubber stamp**, not a statistic: the handled
percentage, angled and overlapping the card's edge, because the number is
going to say `0.0%` forever. A big-number-with-small-label hero was the
obvious treatment and was rejected as the generic default.

It waits for `useStats().loaded` before rendering — the opening line
quotes a count, and "around 0 datacenters" is a worse welcome than a beat
of nothing.

## The readout: `LoadMeter`

One bar showing how much of the confirmed map has been marked handled. The
red stretch is everything still running, and it's always almost all of it.
Tick marks make it read as a gauge (an instrument reading) rather than a
progress bar (a task nearing completion). Capped at `max-w-md`; stretched
full-width it stopped looking like a gauge and started looking like an
error banner.

## Map pins

Switchgear on a one-line diagram, not map teardrops:

- **Filled square** — still humming
- **Hollow square** — handled, allegedly
- **Centre dot** — locked reference site
- **Size** (12/15/18/22px) — claimed datacenter count

Size matters here: it shows where the compute actually is, instead of
drawing a 120-building corridor and a single shed identically.

## Motion

Two moments, both earned. `energize` fires when a site the community just
confirmed arrives on the board — motion answering the vote that caused it.
`slam` drops the welcome card in with a slight overshoot, like something
put down on a desk. No fade-and-slide entrances per section, no hover
transitions on every card — those are the generic default. `.pressable`
presses *in* rather than lifting, matching the mounted-panel metaphor. All
of it is disabled under `prefers-reduced-motion`.

## Voice

Dry, a bit fond, never earnest. Plain verbs, sentence case, active voice —
the joke is in what's said, not in exclamation marks.

- Buttons say what happens: "Submit for review", "Confirm", "Dispute",
  "Mark handled".
- Empty states invite action: "Nothing left to argue about. The queue is
  empty — go log one yourself."
- Errors say what went wrong and what to do: "A site is already logged
  within ~5km: 'Ashburn'. Vote on that one instead."
- Names stay consistent across a flow — "Confirm" produces "On the board";
  "Mark handled" produces a "Handled" badge.

**Shared vocabulary** (use these words, not synonyms): a site is *still
humming* or *handled*; a submission is *up for debate*, *confirmed* or
*discarded*; seeded entries are *backed by a real source*. The strings
live in `ui/Badge.tsx`, `map/MapLegend.tsx` and `map/SiteActions.tsx`, and
e2e specs assert on them.

The theme toggle says "Dark"/"Light". It previously said "FIELD MANUAL",
which collided with the nav link of the same name — two different things
can't share a name.

## Quality floor

Responsive to phone width with a 16px gutter and no horizontal scroll;
visible keyboard focus (`3px solid var(--watch)`); reduced motion
respected; `role="meter"` on the load gauge with proper `aria-value*`;
review deck fully keyboard-driven (C/D/S).
