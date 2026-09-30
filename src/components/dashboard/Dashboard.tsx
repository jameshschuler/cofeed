import { useState } from "react";
import {
  formatTimeSince,
  formatVolume,
  getLocalDayKey,
  sumFeedVolumesMl,
} from "../../lib/activity-format";
import { useDashboardContext } from "../../contexts/dashboard-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PumpingStats } from "./PumpingStats";
import { WeeklyStats } from "./WeeklyStats";
import { RecentActivity } from "./RecentActivity";

export function Dashboard() {
  const { state, actions } = useDashboardContext();
  const {
    feeds,
    weeklyFeeds,
    weeklyPumpingLogs,
    isLoadingActivity,
    isLoadingWeeklyStats,
    weeklyFeedError,
    weeklyPumpingError,
    isUsingCachedActivity,
    lastSyncedAt,
    displayVolumeUnit,
    householdOptions,
    selectedBabyId,
  } = state;
  const preferredOption = householdOptions.find((option) => option.isPreferred);
  const [currentTime] = useState(() => Date.now());

  const todayKey = getLocalDayKey(new Date(currentTime));
  const todayVolumes = sumFeedVolumesMl(
    feeds.filter((feed) => getLocalDayKey(new Date(feed.started_at)) === todayKey),
  );

  const lastFeedStartedAt = feeds[0]?.started_at ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col bg-background/40 p-3 sm:p-4">
        {householdOptions.length > 1 ? (
          <div className="mb-3 flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span
                id="dashboard-household-label"
                className="text-xs font-medium text-muted-foreground"
              >
                Household
              </span>
              <Select
                items={Object.fromEntries(
                  householdOptions.map((option) => [
                    option.babyId,
                    option.isPreferred
                      ? `${option.householdName} (preferred)`
                      : option.householdName,
                  ]),
                )}
                value={selectedBabyId}
                onValueChange={(value) => {
                  if (value) {
                    actions.onSelectBaby(value);
                  }
                }}
              >
                <SelectTrigger aria-labelledby="dashboard-household-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {householdOptions.map((option) => (
                    <SelectItem key={option.babyId} value={option.babyId}>
                      {option.householdName}
                      {option.isPreferred ? " (preferred)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {preferredOption && selectedBabyId !== preferredOption.babyId ? (
              <p className="text-right text-xs text-muted-foreground">
                New entries are still logged to {preferredOption.householdName}.
              </p>
            ) : null}
          </div>
        ) : null}
        {isUsingCachedActivity ? (
          <p className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Offline · showing recent data
            {lastSyncedAt
              ? ` · Last synced ${new Date(lastSyncedAt).toLocaleString([], {
                  dateStyle: "short",
                  timeStyle: "short",
                })}`
              : ""}
          </p>
        ) : null}
        <div className="rounded-lg border bg-muted/30 px-3 py-2 shadow-sm">
          <p className="text-xs text-muted-foreground">Today's total</p>
          {isLoadingActivity ? (
            <div aria-hidden="true" className="animate-pulse space-y-2 py-1">
              <div className="h-6 w-24 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
          ) : (
            <>
              <p className="text-lg font-semibold text-foreground">
                {formatVolume(todayVolumes.totalMl, displayVolumeUnit)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Formula: {formatVolume(todayVolumes.formulaMl, displayVolumeUnit)} ·
                Breast milk:{" "}
                {formatVolume(todayVolumes.breastMilkMl, displayVolumeUnit)}
              </p>
              {lastFeedStartedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Last feed {formatTimeSince(lastFeedStartedAt, currentTime)}
                </p>
              ) : null}
            </>
          )}
        </div>
        <div className="mt-3">
          <WeeklyStats
            feeds={weeklyFeeds}
            displayVolumeUnit={displayVolumeUnit}
            isLoading={isLoadingWeeklyStats}
            errorMessage={weeklyFeedError}
          />
        </div>
        <div className="mt-3">
          <PumpingStats
            sessions={weeklyPumpingLogs}
            displayVolumeUnit={displayVolumeUnit}
            isLoading={isLoadingWeeklyStats}
            errorMessage={weeklyPumpingError}
          />
        </div>
        <RecentActivity />
      </div>
    </div>
  );
}
