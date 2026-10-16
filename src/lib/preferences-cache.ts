import type { VolumeUnit } from "../types/route-types";

function getKey(userId: string) {
  return `cofeed:volume-unit:${userId}`;
}

export function readCachedVolumeUnit(userId: string): VolumeUnit | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const value = window.localStorage.getItem(getKey(userId));
    return value === "oz" || value === "ml" ? value : null;
  } catch {
    return null;
  }
}

export function writeCachedVolumeUnit(userId: string, unit: VolumeUnit) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(getKey(userId), unit);
  } catch {
    // Storage may be unavailable; preferences still load from the server.
  }
}
