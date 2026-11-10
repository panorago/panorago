/**
 * Place copy was stored after UTF-8 punctuation was read as Windows-1252.
 * An em dash (—) comes back as â€” and an en dash (–) as â€“.
 * Repair those two sequences when reading text so titles, prices, and stories
 * render as the original dashes.
 */
export function repairStoredText(value: string): string {
  return value
    .replaceAll("\u00e2\u20ac\u201d", "\u2014")
    .replaceAll("\u00e2\u20ac\u201c", "\u2013");
}

/** Drop a trailing brand suffix so the root title template can add it once. */
export function titleWithoutBrandSuffix(title: string): string {
  return repairStoredText(title).replace(/\s*\|\s*Panora Go\s*$/i, "").trim();
}
