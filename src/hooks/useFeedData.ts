import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAccessToken } from "../lib/auth-token";
import {
  readActivityCache,
  readLastBabyId,
  writeActivityCache,
  writeLastBabyId,
} from "../lib/activity-cache";
import { getProfile, listFeeds, listPumpingLogs } from "../server/functions";
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
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);
  const [feedsLoadError, setFeedsLoadError] = useState<string | null>(null);
  const [isUsingCachedActivity, setIsUsingCachedActivity] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const feedRequestIdRef = useRef(0);
  const pumpingRequestIdRef = useRef(0);
  const loadRequestIdRef = useRef(0);

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
    if (!userId) return;
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
  const [isLoadingWeeklyStats, setIsLoadingWeeklyStats] = useState(false);
  const [weeklyFeedError, setWeeklyFeedError] = useState<string | null>(null);
  const [weeklyPumpingError, setWeeklyPumpingError] = useState<string | null>(null);

  async function refreshFeedLogs(
    babyId: string,
    filter: FeedFilter = feedFilter,
    date: string | null = selectedDate,
  ) {
    const requestId = ++feedRequestIdRef.current;
    try {
      const feedData = await listFeeds({
        data: {
          accessToken: await getAccessToken(),
          babyId,
          since: null,
          range: filter === "date" ? "date" : filter,
          date: filter === "date" ? date : null,
          limit: 50,
        },
      });
      if (feedRequestIdRef.current !== requestId) return;
      setFeedLogs(feedData);
      saveCachedActivity(babyId, { feeds: feedData });
    } catch (error) {
      if (feedRequestIdRef.current !== requestId) return;
      const cached = getCachedActivity(babyId);
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
    filter: FeedFilter = feedFilter,
    date: string | null = selectedDate,
  ) {
    const requestId = ++pumpingRequestIdRef.current;
    try {
      const pumpingData = await listPumpingLogs({
        data: {
          accessToken: await getAccessToken(),
          babyId,
          since: null,
          range: filter === "date" ? "date" : filter,
          date: filter === "date" ? date : null,
          limit: 100,
        },
      });
      if (pumpingRequestIdRef.current !== requestId) return;
      setPumpingLogs(pumpingData);
      saveCachedActivity(babyId, { pumpingLogs: pumpingData });
    } catch (error) {
      if (pumpingRequestIdRef.current !== requestId) return;
      const cached = getCachedActivity(babyId);
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

  useEffect(() => {
    if ((screen !== "feeds" && screen !== "dashboard") || !session) {
      return;
    }

    async function loadActivity() {
      const loadRequestId = ++loadRequestIdRef.current;
      setIsLoadingFeeds(true);
      setFeedsLoadError(null);

      try {
        const { babyId } = await getProfile({
          data: { accessToken: await getAccessToken() },
        });
        if (session?.user?.id) writeLastBabyId(session.user.id, babyId);
        setActiveBabyId(babyId);
        const dateForScreen = screen === "dashboard" ? null : selectedDate;
        await refreshFeedLogs(
          babyId,
          screen === "dashboard" ? "today" : feedFilter,
          dateForScreen,
        );
        await refreshPumpingLogs(
          babyId,
          screen === "dashboard" ? "today" : feedFilter,
          dateForScreen,
        );

        if (screen === "dashboard") {
          setIsLoadingWeeklyStats(true);
          setWeeklyFeedError(null);
          setWeeklyPumpingError(null);
          const accessToken = await getAccessToken();
          const [weeklyFeeds, weeklyPumping] = await Promise.allSettled([
            listFeeds({
              data: { accessToken, babyId, since: null, range: "week", limit: 100 },
            }),
            listPumpingLogs({
              data: { accessToken, babyId, since: null, range: "week", limit: 100 },
            }),
          ]);

          if (weeklyFeeds.status === "fulfilled") {
            setWeeklyFeedLogs(weeklyFeeds.value);
            saveCachedActivity(babyId, { weeklyFeeds: weeklyFeeds.value });
          } else {
            const cached = getCachedActivity(babyId);
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
            saveCachedActivity(babyId, { weeklyPumpingLogs: weeklyPumping.value });
          } else {
            const cached = getCachedActivity(babyId);
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
        } else {
          setIsLoadingWeeklyStats(false);
        }
      } catch (error) {
        const cachedBabyId = session?.user?.id ? readLastBabyId(session.user.id) : null;
        const cached = cachedBabyId ? getCachedActivity(cachedBabyId) : null;
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
        if (loadRequestIdRef.current === loadRequestId) setIsLoadingFeeds(false);
      }
    }

    void loadActivity();
  }, [screen, session, feedFilter, selectedDate]);

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
    isLoadingFeeds,
    feedsLoadError,
    refreshFeedLogs,
    refreshPumpingLogs,
  };
}
