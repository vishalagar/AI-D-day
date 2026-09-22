/**
 * Strips characters that could be used to inject HTML/script content into
 * stored text fields. React escapes output by default, but this gives
 * defense in depth and keeps stored data clean for any future consumer
 * that isn't React (e.g. raw API responses).
 */
export function stripHtml(value: string): string {
  return value.replace(/[<>]/g, "");
}

export function sanitizeOptional(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const cleaned = stripHtml(value).trim();
  return cleaned.length > 0 ? cleaned : undefined;
}
