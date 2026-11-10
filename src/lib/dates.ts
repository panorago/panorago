const SITE_TIME_ZONE = "Africa/Harare";

/** YYYY-MM-DD for the Panora calendar day (Harare), suitable for `<input type="date">`. */
export function todayDateInputValue(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/** True when `value` is a calendar date strictly before today in Harare. */
export function isPastDateInput(value: string, now = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return value < todayDateInputValue(now);
}
