import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAccessToken } from "../lib/auth-token";
import type { ActivityRange } from "../lib/activity-range";
import { getActivityScope, getListRange } from "../lib/activity-scope";
import { getDeviceTimezone } from "../lib/timezone";
import {
  readActivityCache,
  readLastBabyId,
  writeActivityCache,
  writeLastBabyId,
} from "../lib/activity-cache";
import { listFeeds } from "../server/feeds";
import { getProfile } from "../server/profile";
import { listPumpingLogs } from "../server/pumping";
import type {
  FeedFilter,
  FeedLogItem,
  PumpingLogItem,
  Screen,
} from "../types/route-types";

type UseFeedDataOptions = {
  screen: Screen;
  session: Session | null;
  feedFilter: FeedFilter;
  selectedDate: string | null;
  setErrorMessage: (value: string | null) => void;
};

export function useFeedData({
  screen,
  session,
  feedFilter,
  selectedDate,
  setErrorMessage,
}: UseFeedDataOptions) {
  const [feedLogs, setFeedLogs] = useState<FeedLogItem[]>([]);
  const [weeklyFeedLogs, setWeeklyFeedLogs] = useState<FeedLogItem[]>([]);
  const [pumpingLogs, setPumpingLogs] = useState<PumpingLogItem[]>([]);
  const [weeklyPumpingLogs, setWeeklyPumpingLogs] = useState<PumpingLogItem[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);
  const [targetHouseholdName, setTargetHouseholdName] = useState<string | null>(null);
  const [viewBabyId, setViewBabyId] = useState<string | null>(null);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);
  const [feedsLoadError, setFeedsLoadError] = useState<string | null>(null);
  const [isUsingCachedActivity, setIsUsingCachedActivity] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const feedRequestIdRef = useRef(0);
  const pumpingRequestIdRef = useRef(0);
  const loadRequestIdRef = useRef(0);
  const weeklyRequestIdRef = useRef(0);

  function getCachedActivity(babyId: string) {
    const userId = session?.user?.id;
    return userId ? readActivityCache(userId, babyId) : null;
  }

  function saveCachedActivity(
    babyId: string,
    patch: Partial<{
      feeds: FeedLogItem[];
      pumpingLogs: PumpingLogItem[];
      weeklyFeeds: FeedLogItem[];
      weeklyPumpingLogs: PumpingLogItem[];
    }>,
  ) {
    const userId = session?.user?.id;
    if (!userId) {
      return;
    }
    const cached = getCachedActivity(babyId);
    writeActivityCache(userId, babyId, {
      feeds: patch.feeds ?? cached?.feeds ?? [],
      pumpingLogs: patch.pumpingLogs ?? cached?.pumpingLogs ?? [],
      weeklyFeeds: patch.weeklyFeeds ?? cached?.weeklyFeeds ?? [],
      weeklyPumpingLogs: patch.weeklyPumpingLogs ?? cached?.weeklyPumpingLogs ?? [],
    });
    setLastSyncedAt(new Date().toISOString());
    setIsUsingCachedActivity(false);
  }
  const [isLoadingWeeklyStats, setIsLoadingWeeklyStats] = useState(true);
  const [weeklyFeedError, setWeeklyFeedError] = useState<string | null>(null);
  const [weeklyPumpingError, setWeeklyPumpingError] = useState<string | null>(null);

  async function refreshFeedLogs(
    babyId: string,
    filter: ActivityRange = feedFilter,
    date: string | null = selectedDate,
  ) {
    const { queryBabyId, cacheKey } = getActivityScope(screen, babyId, viewBabyId);
    const requestId = ++feedRequestIdRef.current;
    try {
      const feedData = await listFeeds({
        data: {
          accessToken: await getAccessToken(),
          babyId: queryBabyId,
          since: null,
          timezone: getDeviceTimezone(),
          range: filter === "date" ? "date" : filter,
          date: filter === "date" ? date : null,
          limit: 50,
        },
      });
      if (feedRequestIdRef.current !== requestId) {
        return;
      }
      setFeedLogs(feedData);
      saveCachedActivity(cacheKey, { feeds: feedData });
    } catch (error) {
      if (feedRequestIdRef.current !== requestId) {
        return;
      }
      const cached = getCachedActivity(cacheKey);
      if (cached) {
        setFeedLogs(cached.feeds);
        setLastSyncedAt(cached.savedAt);
        setIsUsingCachedActivity(true);
      }
      setFeedsLoadError(
        error instanceof Error ? error.message : "Unable to load feed logs.",
      );
    }
  }

  async function refreshPumpingLogs(
    babyId: string,
    filter: ActivityRange = feedFilter,
    date: string | null = selectedDate,
  ) {
    const { queryBabyId, cacheKey } = getActivityScope(screen, babyId, viewBabyId);
    const requestId = ++pumpingRequestIdRef.current;
    try {
      const pumpingData = await listPumpingLogs({
        data: {
          accessToken: await getAccessToken(),
          babyId: queryBabyId,
          since: null,
          timezone: getDeviceTimezone(),
          range: filter === "date" ? "date" : filter,
          date: filter === "date" ? date : null,
          limit: 100,
        },
      });
      if (pumpingRequestIdRef.current !== requestId) {
        return;
      }
      setPumpingLogs(pumpingData);
      saveCachedActivity(cacheKey, { pumpingLogs: pumpingData });
    } catch (error) {
      if (pumpingRequestIdRef.current !== requestId) {
        return;
      }
      const cached = getCachedActivity(cacheKey);
      if (cached) {
        setPumpingLogs(cached.pumpingLogs);
        setLastSyncedAt(cached.savedAt);
        setIsUsingCachedActivity(true);
      } else {
        setPumpingLogs([]);
      }
      setFeedsLoadError(
        error instanceof Error ? error.message : "Unable to load pumping activity.",
      );
    }
  }

  async function refreshWeeklyStats(babyId: string, { showLoading = true } = {}) {
    const requestId = ++weeklyRequestIdRef.current;
    if (showLoading) {
      setIsLoadingWeeklyStats(true);
    }
    setWeeklyFeedError(null);
    setWeeklyPumpingError(null);
    const accessToken = await getAccessToken();
    const { queryBabyId, cacheKey } = getActivityScope("dashboard", babyId, viewBabyId);
    const [weeklyFeeds, weeklyPumping] = await Promise.allSettled([
      listFeeds({
        data: {
          accessToken,
          babyId: queryBabyId,
          since: null,
          range: "week",
          timezone: getDeviceTimezone(),
          limit: 100,
        },
      }),
      listPumpingLogs({
        data: {
          accessToken,
          babyId: queryBabyId,
          since: null,
          range: "week",
          timezone: getDeviceTimezone(),
          limit: 100,
        },
      }),
    ]);
    if (weeklyRequestIdRef.current !== requestId) {
      return;
    }

    if (weeklyFeeds.status === "fulfilled") {
      setWeeklyFeedLogs(weeklyFeeds.value);
      saveCachedActivity(cacheKey, { weeklyFeeds: weeklyFeeds.value });
    } else {
      const cached = getCachedActivity(cacheKey);
      setWeeklyFeedLogs(cached?.weeklyFeeds ?? []);
      setWeeklyFeedError(
        cached
          ? "Offline · showing cached feed stats."
          : "Unable to load weekly feed stats.",
      );
      if (cached) {
        setLastSyncedAt(cached.savedAt);
        setIsUsingCachedActivity(true);
      }
    }

    if (weeklyPumping.status === "fulfilled") {
      setWeeklyPumpingLogs(weeklyPumping.value);
      saveCachedActivity(cacheKey, { weeklyPumpingLogs: weeklyPumping.value });
    } else {
      const cached = getCachedActivity(cacheKey);
      setWeeklyPumpingLogs(cached?.weeklyPumpingLogs ?? []);
      setWeeklyPumpingError(
        cached
          ? "Offline · showing cached pumping stats."
          : "Unable to load weekly pumping stats.",
      );
      if (cached) {
        setLastSyncedAt(cached.savedAt);
        setIsUsingCachedActivity(true);
      }
    }
    setIsLoadingWeeklyStats(false);
  }

  useEffect(() => {
    if (
      (screen !== "feeds" && screen !== "pumping" && screen !== "dashboard") ||
      !session
    ) {
      return;
    }

    async function loadActivity() {
      const loadRequestId = ++loadRequestIdRef.current;
      setIsLoadingFeeds(true);
      setFeedsLoadError(null);

      try {
        const { babyId, householdName, householdCount } = await getProfile({
          data: { accessToken: await getAccessToken(), timezone: getDeviceTimezone() },
        });
        if (session?.user?.id) {
          writeLastBabyId(session.user.id, babyId);
        }
        setActiveBabyId(babyId);
        setTargetHouseholdName(householdCount > 1 ? householdName : null);
        const dateForScreen = screen === "dashboard" ? null : selectedDate;
        await refreshFeedLogs(babyId, getListRange(screen, feedFilter), dateForScreen);
        await refreshPumpingLogs(
          babyId,
          getListRange(screen, feedFilter),
          dateForScreen,
        );

        if (screen === "dashboard") {
          await refreshWeeklyStats(babyId);
        } else {
          setIsLoadingWeeklyStats(false);
        }
      } catch (error) {
        const cachedBabyId = session?.user?.id ? readLastBabyId(session.user.id) : null;
        const cached = cachedBabyId
          ? getCachedActivity(
              getActivityScope(screen, cachedBabyId, viewBabyId).cacheKey,
            )
          : null;
        if (cachedBabyId && cached) {
          setActiveBabyId(cachedBabyId);
          setFeedLogs(cached.feeds);
          setPumpingLogs(cached.pumpingLogs);
          setWeeklyFeedLogs(cached.weeklyFeeds);
          setWeeklyPumpingLogs(cached.weeklyPumpingLogs);
          setLastSyncedAt(cached.savedAt);
          setIsUsingCachedActivity(true);
          setIsLoadingWeeklyStats(false);
          return;
        }
        setIsLoadingWeeklyStats(false);
        setFeedsLoadError(
          error instanceof Error ? error.message : "Unable to load baby profile.",
        );
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load activity.",
        );
      } finally {
        if (loadRequestIdRef.current === loadRequestId) {
          setIsLoadingFeeds(false);
        }
      }
    }

    void loadActivity();
  }, [screen, session, feedFilter, selectedDate, viewBabyId]);

  return {
    feedLogs,
    weeklyFeedLogs,
    pumpingLogs,
    weeklyPumpingLogs,
    isLoadingWeeklyStats,
    weeklyFeedError,
    weeklyPumpingError,
    isUsingCachedActivity,
    lastSyncedAt,
    activeBabyId,
    targetHouseholdName,
    viewBabyId,
    setViewBabyId,
    isLoadingFeeds,
    feedsLoadError,
    refreshFeedLogs,
    refreshPumpingLogs,
    refreshWeeklyStats,
  };
}
