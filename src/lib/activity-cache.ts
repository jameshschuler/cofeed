import type { FeedLogItem, PumpingLogItem } from "../types/route-types";

type ActivityCache = {
  savedAt: string;
  feeds: FeedLogItem[];
  pumpingLogs: PumpingLogItem[];
  weeklyFeeds: FeedLogItem[];
  weeklyPumpingLogs: PumpingLogItem[];
};

function getKey(userId: string, babyId: string) {
  return `cofeed:activity:${userId}:${babyId}`;
}

function getBabyKey(userId: string) {
  return `cofeed:last-baby:${userId}`;
}

export function readLastBabyId(userId: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(getBabyKey(userId));
}

export function writeLastBabyId(userId: string, babyId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getBabyKey(userId), babyId);
  } catch {
    // Storage may be unavailable; network activity still works.
  }
}

export function readActivityCache(
  userId: string,
  babyId: string,
): ActivityCache | null {
  if (typeof window === "undefined") return null;

  try {
    const value = window.localStorage.getItem(getKey(userId, babyId));
    return value ? (JSON.parse(value) as ActivityCache) : null;
  } catch {
    return null;
  }
}

export function writeActivityCache(
  userId: string,
  babyId: string,
  value: Omit<ActivityCache, "savedAt">,
) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      getKey(userId, babyId),
      JSON.stringify({ ...value, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Storage may be unavailable or full; network activity still works.
  }
}
