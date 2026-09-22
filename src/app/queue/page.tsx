import type { Metadata } from "next";

import { ReviewQueue } from "@/components/queue/ReviewQueue";

export const metadata: Metadata = {
  title: "Review queue — AI D-Day",
  description:
    "Vote on submitted datacenter sites. Confirmed entries go on the map; disputed ones are discarded.",
};

export default function QueuePage() {
  return <ReviewQueue />;
}
