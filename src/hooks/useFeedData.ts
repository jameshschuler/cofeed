import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getAccessToken } from "../lib/auth-token";
import { getProfile, listFeeds, listPumpingLogs } from "../server/functions";
import type {
  FeedFilter,
  FeedLogItem,
  PumpingLogItem,
  Screen,
} from "../types/route-types";

function getLocalDayStartIso(date = new Date()) {
  const localDayStart = new Date(date);
  localDayStart.setHours(0, 0, 0, 0);
  return localDayStart.toISOString();
}

function getWeekStartIso(date = new Date()) {
  const weekStart = new Date(date);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString();
}

type UseFeedDataOptions = {
  screen: Screen;
  session: Session | null;
  feedFilter: FeedFilter;
  setErrorMessage: (value: string | null) => void;
};

export function useFeedData({
  screen,
  session,
  feedFilter,
  setErrorMessage,
}: UseFeedDataOptions) {
  const [feedLogs, setFeedLogs] = useState<FeedLogItem[]>([]);
  const [weeklyFeedLogs, setWeeklyFeedLogs] = useState<FeedLogItem[]>([]);
  const [pumpingLogs, setPumpingLogs] = useState<PumpingLogItem[]>([]);
  const [weeklyPumpingLogs, setWeeklyPumpingLogs] = useState<PumpingLogItem[]>([]);
  const [activeBabyId, setActiveBabyId] = useState<string | null>(null);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);
  const [feedsLoadError, setFeedsLoadError] = useState<string | null>(null);

  async function refreshFeedLogs(babyId: string, filter: FeedFilter = feedFilter) {
    try {
      const feedData = await listFeeds({
        data: {
          accessToken: await getAccessToken(),
          babyId,
          since: filter === "today" ? getLocalDayStartIso() : null,
          limit: 50,
        },
      });
      setFeedLogs(feedData);
    } catch (error) {
      setFeedsLoadError(
        error instanceof Error ? error.message : "Unable to load feed logs.",
      );
    }
  }

  async function refreshPumpingLogs(babyId: string, filter: FeedFilter = feedFilter) {
    try {
      const pumpingData = await listPumpingLogs({
        data: {
          accessToken: await getAccessToken(),
          babyId,
          since: filter === "today" ? getLocalDayStartIso() : null,
          limit: 100,
        },
      });
      setPumpingLogs(pumpingData);
    } catch (error) {
      setPumpingLogs([]);
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
      setIsLoadingFeeds(true);
      setFeedsLoadError(null);

      try {
        const { babyId } = await getProfile({
          data: { accessToken: await getAccessToken() },
        });
        setActiveBabyId(babyId);
        await refreshFeedLogs(babyId, screen === "dashboard" ? "today" : feedFilter);
        await refreshPumpingLogs(babyId, screen === "dashboard" ? "today" : feedFilter);

        if (screen === "dashboard") {
          try {
            const accessToken = await getAccessToken();
            const [weeklyFeeds, weeklyPumping] = await Promise.all([
              listFeeds({
                data: { accessToken, babyId, since: getWeekStartIso(), limit: 100 },
              }),
              listPumpingLogs({
                data: { accessToken, babyId, since: getWeekStartIso(), limit: 100 },
              }),
            ]);
            setWeeklyFeedLogs(weeklyFeeds);
            setWeeklyPumpingLogs(weeklyPumping);
          } catch {
            setWeeklyFeedLogs([]);
            setWeeklyPumpingLogs([]);
          }
        }
      } catch (error) {
        setFeedsLoadError(
          error instanceof Error ? error.message : "Unable to load baby profile.",
        );
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load activity.",
        );
      } finally {
        setIsLoadingFeeds(false);
      }
    }

    void loadActivity();
  }, [screen, session, feedFilter]);

  return {
    feedLogs,
    weeklyFeedLogs,
    pumpingLogs,
    weeklyPumpingLogs,
    activeBabyId,
    isLoadingFeeds,
    feedsLoadError,
    refreshFeedLogs,
    refreshPumpingLogs,
  };
}
