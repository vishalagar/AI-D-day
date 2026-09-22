"use client";

import { useEffect, useRef, useState } from "react";

import { ProximityCard } from "@/components/proximity/ProximityCard";
import { WelcomeCard } from "@/components/intro/WelcomeCard";
import { StatsBar } from "@/components/stats/StatsBar";
import { Button } from "@/components/ui/Button";
import { useProximity } from "@/hooks/use-proximity";
import { useSites } from "@/hooks/use-sites";
import { useStats } from "@/hooks/use-stats";
import { useWelcome } from "@/hooks/use-welcome";
import type { VoteValue } from "@/lib/config/moderation";
import type { Site } from "@/lib/db/schema";

import { AddSiteForm } from "./AddSiteForm";
import { MapCanvas } from "./MapCanvas";
import { MapLegend } from "./MapLegend";
import { SiteDetailPanel } from "./SiteDetailPanel";

export function MapView() {
  const {
    sites,
    myVotes,
    loading,
    error,
    refetch,
    replaceSite,
    removeSite,
    setMyVote,
  } = useSites("approved");
  const [addMode, setAddMode] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { stats, loaded: statsLoaded } = useStats(refreshKey);
  const { showWelcome, dismissWelcome } = useWelcome();
  const proximity = useProximity(sites);
  const { locate } = proximity;
  // After a failed geolocation, the next map click is "here's where I live".
  const picking = proximity.state.phase === "failed";

  const checkProximity = () => {
    dismissWelcome();
    setAddMode(false);
    setSelectedSite(null);
    proximity.locate();
  };

  // Arriving from a shared result's "Check yours" link runs the check once
  // the board has loaded — the visitor clicked a button that said so.
  const autoChecked = useRef(false);
  useEffect(() => {
    if (autoChecked.current || loading || sites.length === 0) return;
    if (new URLSearchParams(window.location.search).get("check") !== "1")
      return;
    autoChecked.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    dismissWelcome();
    locate();
  }, [loading, sites.length, dismissWelcome, locate]);

  const bumpStats = () => setRefreshKey((key) => key + 1);

  const afterCreate = () => {
    // The new entry is pending, so it isn't on this (approved) board yet —
    // only the stats bar's queue counter needs to move.
    bumpStats();
    setPendingCoords(null);
    setAddMode(false);
  };

  const afterUpdate = (updated: Site) => {
    replaceSite(updated);
    setSelectedSite(updated);
    bumpStats();
  };

  const afterRemoval = (siteId: string) => {
    removeSite(siteId);
    setSelectedSite(null);
    bumpStats();
  };

  const afterVote = (siteId: string, value: VoteValue) => {
    setMyVote(siteId, value);
    bumpStats();
  };

  return (
    <div className="relative flex flex-1 flex-col">
      <StatsBar stats={stats} />

      {/* Clipped so the result stamp's drop-in overshoot can't open a
          horizontal scrollbar on a phone for the length of the animation. */}
      <div className="relative flex-1 overflow-hidden">
        <MapCanvas
          sites={sites}
          addMode={addMode || picking}
          proximity={
            proximity.state.phase === "found"
              ? { you: proximity.state.you, site: proximity.state.site }
              : null
          }
          onMapClick={(lat, lng) =>
            picking
              ? proximity.measureFrom({ lat, lng })
              : setPendingCoords({ lat, lng })
          }
          onPinClick={setSelectedSite}
        />

        {/* Hidden while a proximity result is up: on a phone the two stack
            on top of each other, and the result is the thing to look at. */}
        {proximity.state.phase !== "found" && (
          <>
            {/* Lifted clear of Leaflet's attribution strip along the bottom edge,
            which the legend was otherwise sitting on top of. */}
            <div className="absolute bottom-8 left-4 z-[1000] flex max-w-[min(18rem,calc(100vw-2rem))] flex-col items-start gap-2">
              {/* Legend above the button: the button is the primary action and
              belongs at the bottom edge, and stacking it first pushed the
              legend off-screen. */}
              {addMode ? (
                <p className="hard-border hard-shadow-sm bg-panel px-2 py-1.5 text-xs">
                  Click the map where the site is. You&rsquo;ll fill in the
                  details next.
                </p>
              ) : (
                <MapLegend />
              )}
              <Button
                variant={addMode ? "alert" : "ok"}
                onClick={() => setAddMode((value) => !value)}
              >
                {addMode ? "Cancel" : "Log a site"}
              </Button>
            </div>
          </>
        )}

        <ProximityPrompt
          phase={proximity.state.phase}
          failure={
            proximity.state.phase === "failed" ? proximity.state.message : null
          }
          ready={!loading && sites.length > 0}
          onCheck={checkProximity}
          onCancel={proximity.reset}
        />

        {proximity.state.phase === "found" && (
          <ProximityCard
            site={proximity.state.site}
            km={proximity.state.km}
            nearbyCount={proximity.state.nearbyCount}
            onClose={proximity.reset}
          />
        )}

        {/* Held back until the counts land — the card's opening line quotes
            one, and "around 0 datacenters" is a worse welcome than a beat of
            nothing. */}
        {showWelcome && statsLoaded && (
          <WelcomeCard
            stats={stats}
            onDismiss={dismissWelcome}
            onCheck={checkProximity}
          />
        )}

        {loading && <Notice>Loading the board…</Notice>}
        {error && (
          <Notice tone="alert">
            {error}{" "}
            <button
              type="button"
              onClick={() => void refetch()}
              className="underline underline-offset-2"
            >
              Retry
            </button>
          </Notice>
        )}
      </div>

      {pendingCoords && (
        <AddSiteForm
          lat={pendingCoords.lat}
          lng={pendingCoords.lng}
          onCancel={() => setPendingCoords(null)}
          onCreated={afterCreate}
        />
      )}

      {selectedSite && (
        <SiteDetailPanel
          site={selectedSite}
          myVote={myVotes[selectedSite.id]}
          onClose={() => setSelectedSite(null)}
          onUpdated={afterUpdate}
          onRemoved={afterRemoval}
          onVoted={afterVote}
        />
      )}
    </div>
  );
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "alert";
}) {
  return (
    <div
      role="status"
      className={`hard-border hard-shadow-sm absolute right-3 top-16 z-[1000] max-w-64 bg-panel px-2 py-1.5 text-xs ${
        tone === "alert" ? "border-alert text-alert" : ""
      }`}
    >
      {children}
    </div>
  );
}

function ProximityPrompt({
  phase,
  failure,
  ready,
  onCheck,
  onCancel,
}: {
  ready: boolean;
  phase: ReturnType<typeof useProximity>["state"]["phase"];
  failure: string | null;
  onCheck: () => void;
  onCancel: () => void;
}) {
  if (phase === "found") return null;

  if (failure) {
    return (
      <div
        role="status"
        className="hard-border hard-shadow-sm absolute right-3 top-3 z-[1000] flex max-w-72 items-start gap-3 bg-panel px-3 py-2 text-xs"
      >
        <span>{failure}</span>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 font-semibold underline underline-offset-2"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="pop"
      onClick={onCheck}
      disabled={!ready || phase === "locating"}
      className="absolute right-3 top-3 z-[1000]"
    >
      {phase === "locating" ? "Finding you…" : "How close is the nearest AI?"}
    </Button>
  );
}
