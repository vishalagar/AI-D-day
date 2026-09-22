"use client";

import "leaflet/dist/leaflet.css";

import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";

import type { Point } from "@/lib/geo/distance";
import type { Site } from "@/lib/db/schema";

import { ProximityLayer } from "./ProximityLayer";
import { siteIcon } from "./SitePin";

interface MapCanvasProps {
  sites: Site[];
  addMode: boolean;
  /** You, the nearest humming site, and the line between — once measured. */
  proximity?: { you: Point; site: Point } | null;
  /** Site that was just voted onto the board, animated in once. */
  arrivingSiteId?: string | null;
  onMapClick: (lat: number, lng: number) => void;
  onPinClick: (site: Site) => void;
}

function ClickListener({
  addMode,
  onMapClick,
}: {
  addMode: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!addMode) return;
      // wrap() normalises longitude back into [-180, 180]. Leaflet reports
      // raw coordinates, so a click on one of the repeated world copies
      // either side of the centre yields e.g. 184.2 — which the API rejects.
      // At low zoom on a wide screen those copies are most of the viewport.
      const { lat, lng } = event.latlng.wrap();
      onMapClick(lat, lng);
    },
  });
  return null;
}

export function MapCanvas({
  sites,
  addMode,
  proximity,
  arrivingSiteId,
  onMapClick,
  onPinClick,
}: MapCanvasProps) {
  return (
    <MapContainer
      center={[20, 5]}
      zoom={2}
      minZoom={2}
      worldCopyJump
      // Without bounds, panning north exposes a band of empty container
      // above latitude 85 that reads as a broken tile layer. Viscosity 1
      // makes the edge a hard stop rather than a rubber band.
      maxBounds={[
        [-85, -Infinity],
        [85, Infinity],
      ]}
      maxBoundsViscosity={1}
      className={`absolute inset-0 map-canvas ${addMode ? "cursor-crosshair" : ""}`}
    >
      <TileLayer
        attribution="Tiles &copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />
      <ClickListener addMode={addMode} onMapClick={onMapClick} />
      {proximity && <ProximityLayer you={proximity.you} site={proximity.site} />}
      {sites.map((site) => (
        <Marker
          key={site.id}
          position={[site.lat, site.lng]}
          icon={siteIcon(site, site.id === arrivingSiteId)}
          title={site.name}
          alt={site.name}
          eventHandlers={{ click: () => onPinClick(site) }}
        />
      ))}
    </MapContainer>
  );
}
