import { useState } from "react";
import { useDashboardContext } from "../../contexts/dashboard-context";
import {
  formatTimeSince,
  formatVolume,
  getLocalDayKey,
  isOnLocalDay,
  summarizeFeeds,
} from "../../lib/activity-format";
import { pluralize } from "../../lib/utils";
import { Skeleton } from "../ui/skeleton";

export function TodayFeedSummary() {
  const { state } = useDashboardContext();
  const { feeds, displayVolumeUnit, isLoadingActivity } = state;
  const [now] = useState(() => Date.now());
  const todayKey = getLocalDayKey(new Date(now));
  const summary = summarizeFeeds(
    feeds.filter((feed) => isOnLocalDay(feed.started_at, todayKey)),
  );
  const lastFeedAt = feeds[0]?.started_at ?? null;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 shadow-sm">
      <p className="text-xs text-muted-foreground">Today's feeds</p>
      {isLoadingActivity ? (
        <div className="space-y-2 py-1">
          <span className="sr-only">Loading today's feeds…</span>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-36" />
        </div>
      ) : (
        <>
          <p className="text-lg font-semibold text-foreground">
            {formatVolume(summary.totalMl, displayVolumeUnit)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.count > 0
              ? `${pluralize(summary.count, "feed")} · avg ${formatVolume(summary.averageMl, displayVolumeUnit)} per feed`
              : "No feeds yet today"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Formula: {formatVolume(summary.formulaMl, displayVolumeUnit)} · Breast milk:{" "}
            {formatVolume(summary.breastMilkMl, displayVolumeUnit)}
          </p>
          {lastFeedAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Last feed {formatTimeSince(lastFeedAt, now)}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
