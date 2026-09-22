export interface Verdict {
  id: string;
  /** Exclusive upper bound, in km. */
  underKm: number;
  title: string;
  line: string;
}

/**
 * The punchline tiers for "how close is the nearest AI". Ordered nearest
 * first; the last tier's bound is Infinity so every distance lands somewhere.
 * The humour is about hum, power bills and training data — never about
 * doing anything to the building.
 */
export const VERDICTS: readonly Verdict[] = [
  {
    id: "next-door",
    underKm: 5,
    title: "Next door",
    line: "You can hear the fans. Your wifi is probably helping.",
  },
  {
    id: "hum-zone",
    underKm: 25,
    title: "Hum zone",
    line: "It can see your house from here. Metaphorically. Probably.",
  },
  {
    id: "commuter-belt",
    underKm: 100,
    title: "Commuter belt",
    line: "Close enough that your power bill is quietly funding someone's chatbot.",
  },
  {
    id: "regional",
    underKm: 500,
    title: "Regional",
    line: "Far enough to sleep at night. Close enough to be in its training data.",
  },
  {
    id: "remote",
    underKm: 2000,
    title: "Remote",
    line: "Comfortably distant. For now.",
  },
  {
    id: "off-grid",
    underKm: Infinity,
    title: "Off the grid",
    line: "Either you've won, or nobody has logged the one near you yet.",
  },
];

export function verdictFor(km: number): Verdict {
  return (
    VERDICTS.find((verdict) => km < verdict.underKm) ??
    VERDICTS[VERDICTS.length - 1]
  );
}

/** "23 km" / "1,204 km" — whole kilometres read better on a poster. */
export function formatKm(km: number): string {
  return `${Math.round(km).toLocaleString("en-US")} km`;
}
