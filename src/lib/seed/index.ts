import { AMERICAS } from "./americas";
import { ASIA_PACIFIC, MIDDLE_EAST_AFRICA } from "./asia-pacific";
import { EUROPE } from "./europe";
import type { SeedSite } from "./types";

export const SEED_SITES: SeedSite[] = [
  ...AMERICAS,
  ...EUROPE,
  ...ASIA_PACIFIC,
  ...MIDDLE_EAST_AFRICA,
];

export type { SeedSite };
export { SOURCES } from "./types";
