import { z } from "zod";

import { VOTE_DOWN, VOTE_UP } from "@/lib/config/moderation";

export const voteSchema = z.object({
  value: z.literal([VOTE_UP, VOTE_DOWN]),
});

export const moderationFilterSchema = z
  .enum(["approved", "pending", "rejected"])
  .default("approved");

export type VoteInput = z.infer<typeof voteSchema>;
