import { getZonedDateStart, getZonedDayStart, getZonedDaysAgoStart } from "./timezone";

export const ACTIVITY_RANGES = [
  "today",
  "week",
  "all",
  "date",
  "yesterday",
  "last24h",
] as const;
export type ActivityRange = (typeof ACTIVITY_RANGES)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

export function getRangeBounds(
  range: ActivityRange,
  date: string | null | undefined,
  since: string | null | undefined,
  timezone: string,
  now = new Date(),
): { since: Date | null; until: Date | null } {
  if (range === "today") {
    return { since: getZonedDayStart(now, timezone), until: null };
  }
  if (range === "last24h") {
    return { since: new Date(now.getTime() - DAY_MS), until: null };
  }
  if (range === "yesterday") {
    return {
      since: getZonedDaysAgoStart(now, timezone, 1),
      until: getZonedDayStart(now, timezone),
    };
  }
  if (range === "week") {
    return { since: getZonedDaysAgoStart(now, timezone, 6), until: null };
  }
  if (range === "date" && date) {
    return {
      since: getZonedDateStart(date, timezone),
      until: getZonedDateStart(date, timezone, 1),
    };
  }
  return { since: since ? new Date(since) : null, until: null };
}
