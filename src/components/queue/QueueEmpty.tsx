import Link from "next/link";

interface QueueEmptyProps {
  /** How many submissions this visitor got through in this sitting. */
  reviewed: number;
}

/** An empty screen is an invitation to act, so it points at the next thing. */
export function QueueEmpty({ reviewed }: QueueEmptyProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-start gap-4 p-6">
      <h1 className="poster text-3xl">Nothing left to argue about.</h1>
      <p className="max-w-prose text-sm text-ink-dim">
        {reviewed > 0
          ? `You settled ${reviewed} ${reviewed === 1 ? "submission" : "submissions"} this sitting. The queue is empty — go find one nobody's logged yet.`
          : "The queue is empty. New submissions land here the second somebody logs one, so check back, or go log one yourself."}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/"
          className="hard-border hard-shadow pressable bg-pop text-paper border-pop px-4 py-2 text-sm font-bold"
        >
          Back to the map
        </Link>
        <Link
          href="/guide"
          className="hard-border hard-shadow pressable bg-panel px-4 py-2 text-sm font-bold"
        >
          Read the field manual
        </Link>
      </div>
    </div>
  );
}
