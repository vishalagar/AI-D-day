interface LocationPreviewProps {
  lat: number;
  lng: number;
  name: string;
}

/**
 * Roughly a 25km box. Tighter than this and a site in open country (or open
 * ocean) renders as a featureless blank, which tells a reviewer nothing;
 * this keeps a recognisable town or coastline in frame.
 */
const BOX = 0.16;

/**
 * OpenStreetMap's keyless embed. A reviewer deciding whether a submission is
 * real needs to see what's actually at those coordinates, and this shows it
 * without pulling Leaflet into the queue bundle or needing a tile API key.
 */
export function LocationPreview({ lat, lng, name }: LocationPreviewProps) {
  const bbox = [lng - BOX, lat - BOX / 2, lng + BOX, lat + BOX / 2].join(",");
  const src =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="hard-border bg-panel">
      <iframe
        src={src}
        title={`Map showing the reported location of ${name}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="block w-full h-44"
      />
    </div>
  );
}
