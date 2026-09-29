import { useState } from "react";
import { Droplet, Milk } from "lucide-react";
import {
  formatPortion,
  formatTime,
  formatTimeSince,
  formatVolume,
  getFeedVolumesMl,
  sumFeedVolumesMl,
} from "../lib/activity-format";
import { useDashboardContext } from "./dashboard-context";
import { EmptyState } from "./ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { SourceBadge } from "./ui/badge";
import { cn } from "../lib/utils";

const ACTIVITY_STYLES = {
  feed: {
    label: "Feed",
    Icon: Milk,
    card: "border-l-4 border-l-primary",
    icon: "bg-primary/10 text-primary",
    chip: "border-primary/30 bg-primary/10 text-primary",
  },
  pumping: {
    label: "Pump",
    Icon: Droplet,
    card: "border-l-4 border-l-sky-500 bg-sky-50/60 dark:bg-sky-950/20",
    icon: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    chip: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
} as const;

function ActivityHeader({
  kind,
  title,
}: {
  kind: keyof typeof ACTIVITY_STYLES;
  title: string;
}) {
  const style = ACTIVITY_STYLES[kind];
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            style.icon,
          )}
        >
          <style.Icon className="size-4" />
        </span>
        <p className="text-sm font-medium">{title}</p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
          style.chip,
        )}
      >
        {style.label}
      </span>
    </div>
  );
}
import { PumpingStats } from "./PumpingStats";
import { WeeklyStats } from "./WeeklyStats";

export function Dashboard() {
  const { state, actions } = useDashboardContext();
  const {
    feeds,
    weeklyFeeds,
    pumpingLogs,
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

  const todayVolumes = sumFeedVolumesMl(feeds);

  const lastFeedStartedAt = feeds[0]?.started_at ?? null;
  const recentActivities = [
    ...feeds.map((feed) => ({ type: "feed" as const, at: feed.started_at, feed })),
    ...pumpingLogs.map((session) => ({
      type: "pumping" as const,
      at: session.started_at,
      session,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5);

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
        <p className="mt-4 text-sm font-medium text-foreground">Recent activity</p>
        {isLoadingActivity ? (
          <div className="mt-3 space-y-3 pr-1">
            <span className="sr-only">Loading recent activity…</span>
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="h-20 animate-pulse rounded-lg border bg-muted/20"
              />
            ))}
          </div>
        ) : recentActivities.length > 0 ? (
          <div className="mt-3 space-y-3 pr-1">
            {recentActivities.map((activity) => {
              if (activity.type === "pumping") {
                return (
                  <div
                    key={`pumping-${activity.session.id}`}
                    className={cn(
                      "space-y-1 rounded-lg border px-4 py-3 shadow-sm",
                      ACTIVITY_STYLES.pumping.card,
                    )}
                  >
                    <ActivityHeader
                      kind="pumping"
                      title={`Pumped ${formatPortion(
                        activity.session.volume,
                        activity.session.unit,
                        displayVolumeUnit,
                      )}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatTime(activity.session.started_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.session.household_name} ·{" "}
                      {activity.session.logger_name ?? "Unknown caregiver"}
                    </p>
                    <SourceBadge source={activity.session.source} />
                  </div>
                );
              }

              const feed = activity.feed;
              const hasFormula =
                !!feed.formula_portion_volume && feed.formula_portion_volume > 0;
              const hasBreastMilk =
                !!feed.breast_milk_portion_volume &&
                feed.breast_milk_portion_volume > 0;
              const { totalMl } = getFeedVolumesMl(feed);

              return (
                <div
                  key={feed.id}
                  className={cn(
                    "space-y-2 rounded-lg border px-4 py-3 shadow-sm",
                    ACTIVITY_STYLES.feed.card,
                  )}
                >
                  <div className="space-y-1">
                    <ActivityHeader
                      kind="feed"
                      title={formatVolume(totalMl, displayVolumeUnit)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formatTime(feed.started_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {feed.household_name} · {feed.logger_name ?? "Unknown caregiver"}
                    </p>
                    <SourceBadge source={feed.source} />
                  </div>
                  <div className="space-y-1">
                    {hasFormula ? (
                      <p className="text-xs text-muted-foreground">
                        Formula:{" "}
                        {formatPortion(
                          feed.formula_portion_volume,
                          feed.formula_portion_unit,
                          displayVolumeUnit,
                        )}
                      </p>
                    ) : null}
                    {hasBreastMilk ? (
                      <p className="text-xs text-muted-foreground">
                        Breast milk:{" "}
                        {formatPortion(
                          feed.breast_milk_portion_volume,
                          feed.breast_milk_portion_unit,
                          displayVolumeUnit,
                        )}
                      </p>
                    ) : null}
                  </div>
                  {!(hasFormula && hasBreastMilk) ? (
                    <span className="inline-block rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                      {hasBreastMilk ? "Breast milk only" : "Formula only"}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Milk}
            title="No bottles logged today"
            description="Tap + to log your first feed."
          />
        )}
      </div>
    </div>
  );
}
