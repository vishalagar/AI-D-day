"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-sm text-ink-dim">
      Loading the map...
    </div>
  ),
});

export function MapViewLoader() {
  return <MapView />;
}
