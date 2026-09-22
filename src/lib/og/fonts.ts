type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" };

const FAMILIES = [
  { name: "Archivo Black", query: "Archivo+Black", weight: 400 as const },
  { name: "Archivo", query: "Archivo:wght@600", weight: 700 as const },
];

/**
 * Pulls TTFs from Google Fonts at request time rather than bundling them
 * (ImageResponse caps the bundle at 500KB). Google serves TTF to a client
 * that doesn't advertise woff2 support, which a bare server fetch doesn't.
 * A failure falls back to the renderer's default face — an off-brand
 * preview beats a broken one.
 */
async function loadFamily({ name, query, weight }: (typeof FAMILIES)[number]) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${query}`).then(
    (response) => response.text(),
  );
  const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
  if (!url) throw new Error(`No TTF source for ${name}`);
  const data = await fetch(url).then((response) => response.arrayBuffer());
  return { name, data, weight, style: "normal" as const };
}

let cached: Promise<OgFont[]> | undefined;

export function ogFonts(): Promise<OgFont[]> {
  cached ??= Promise.all(FAMILIES.map(loadFamily)).catch((error: unknown) => {
    console.error("[og] font load failed, using default face", error);
    cached = undefined;
    return [];
  });
  return cached;
}
