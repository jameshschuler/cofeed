import type { ActivityRange } from "./activity-range";
import type { FeedFilter, Screen } from "../types/route-types";

export const ALL_HOUSEHOLDS_CACHE_KEY = "all-households";

// The dashboard shows one baby (the preferred one unless another is being viewed); the
// history screens list every household. Each view is cached under its own key so offline
// data never shows one scope's entries under another's.
export function getActivityScope(
  screen: Screen,
  preferredBabyId: string,
  viewBabyId: string | null,
) {
  if (screen === "dashboard") {
    const babyId = viewBabyId ?? preferredBabyId;
    return { queryBabyId: babyId as string | null, cacheKey: babyId };
  }
  return { queryBabyId: null, cacheKey: ALL_HOUSEHOLDS_CACHE_KEY };
}

// The dashboard's recent activity covers the rolling last 24 hours; history screens use
// the day the user picked.
export function getListRange(screen: Screen, filter: FeedFilter): ActivityRange {
  return screen === "dashboard" ? "last24h" : filter;
}
