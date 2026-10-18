const LOCALE = "en";

const countFormat = new Intl.NumberFormat(LOCALE);
const dateFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" });
const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const RELATIVE_UNTIL = 30 * DAY;

export function formatCount(count: number): string {
  return countFormat.format(count);
}

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

export function formatDateTime(date: Date): string {
  return dateTimeFormat.format(date);
}

/** "4 minutes ago" for the last month, the date before it. */
export function formatRelativeTime(date: Date, now: Date): string {
  const elapsed = now.getTime() - date.getTime();
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return relativeFormat.format(-Math.floor(elapsed / MINUTE), "minute");
  if (elapsed < DAY) return relativeFormat.format(-Math.floor(elapsed / HOUR), "hour");
  if (elapsed < RELATIVE_UNTIL) return relativeFormat.format(-Math.floor(elapsed / DAY), "day");
  return formatDate(date);
}
