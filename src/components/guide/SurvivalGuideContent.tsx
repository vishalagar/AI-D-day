import Link from "next/link";

import { VOTING_WINDOW_HOURS } from "@/lib/config/moderation";
import { SEED_SITES } from "@/lib/seed";

import { GuideSection } from "./GuideSection";

export function SurvivalGuideContent() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <header>
        <h1 className="poster mb-2 text-3xl leading-tight sm:text-4xl">
          Field manual
        </h1>
        <p className="max-w-prose text-sm text-ink-dim">
          This is a game, not a plan. Nobody should act on anything here, and no
          real infrastructure should ever be touched. Read it for the bit.
        </p>
      </header>

      <GuideSection title="How a site gets on the map">
        <p>
          Anyone can submit one. Submissions don&rsquo;t appear on the map
          straight away — they go to the{" "}
          <Link href="/queue" className="underline underline-offset-2">
            review queue
          </Link>
          , where other visitors confirm or dispute them.
        </p>
        <p>
          Every submission stays open for review for at least{" "}
          {VOTING_WINDOW_HOURS} hours, however quickly it gets confirmed. Three
          people agreeing in the first minute is whoever happened to be on the
          queue page, not the community — the window gives everyone else a day
          to disagree. When it closes, an entry that&rsquo;s enough
          confirmations ahead goes on the map.
        </p>
        <p>
          Disputes don&rsquo;t wait: an entry far enough behind is discarded
          straight away, because a queue clogged with junk is what stops people
          reviewing the real ones. Editing an approved site&rsquo;s details
          sends it back through review with a fresh window, because the thing
          people confirmed has changed.
        </p>
        <p>
          You&rsquo;ll see the split of opinion as a percentage rather than a
          running count. The exact number of votes needed is deliberately not
          shown — it stops reviewing turning into a race to cast the deciding
          ballot.
        </p>
      </GuideSection>

      <GuideSection title="Nobody can delete anything">
        <p>
          There&rsquo;s no delete button and no admin. The only way an entry
          leaves the map is by being voted off, which takes several people
          rather than one annoyed visitor.
        </p>
        <p>
          Marking a site handled is different — that&rsquo;s the running joke,
          not moderation. It keeps the record and just moves the pin from
          &ldquo;still humming&rdquo; to &ldquo;handled, allegedly.&rdquo;
        </p>
      </GuideSection>

      <GuideSection title="Where the starting data came from">
        <p>
          {SEED_SITES.length} sites were added by hand from public sources —
          mostly operators&rsquo; own datacenter location pages. Each carries a
          link to where it came from, and they&rsquo;re marked as sourced
          reference entries on the map.
        </p>
        <p>
          Those can&rsquo;t be edited or voted off. They&rsquo;re the anchor
          set, so the map stays useful even if voting goes sideways. Everything
          else is community-submitted and community-reviewed.
        </p>
      </GuideSection>

      <GuideSection title="The counts are estimates">
        <p>
          Every count is someone&rsquo;s approximation, including the seeded
          ones. Operators rarely publish exact building counts and the numbers
          change constantly. Treat them as a running argument, not a census.
        </p>
      </GuideSection>

      <GuideSection title="How voting knows who you are">
        <p>
          It doesn&rsquo;t, really. There are no accounts. Your browser
          generates a random token, which the server hashes together with your
          IP address so one person can&rsquo;t vote on the same site twice.
          Neither the token nor your IP is stored.
        </p>
        <p>
          This is not airtight — anyone determined enough can vote more than
          once. Without accounts, that&rsquo;s the ceiling, and it&rsquo;s a
          trade we made on purpose.
        </p>
      </GuideSection>

      <GuideSection title="This map is fiction">
        <p>
          AI D-Day is satire. It is not intelligence, not a target list, and not
          affiliated with any operation against any real facility. The
          coordinates are approximate and drawn from material that was already
          public.
        </p>
      </GuideSection>
    </div>
  );
}
