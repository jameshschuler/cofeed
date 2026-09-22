import { Milk } from "lucide-react";
import type { FeedLogItem, PumpingLogItem, VolumeUnit } from "../types/route-types";
import { EmptyState } from "./ui/empty-state";
import { PumpingStats } from "./PumpingStats";
import { WeeklyStats } from "./WeeklyStats";

export function Dashboard({
  feeds,
  weeklyFeeds,
  pumpingLogs,
  weeklyPumpingLogs,
  displayVolumeUnit,
}: {
  feeds: FeedLogItem[];
  weeklyFeeds: FeedLogItem[];
  pumpingLogs: PumpingLogItem[];
  weeklyPumpingLogs: PumpingLogItem[];
  displayVolumeUnit: VolumeUnit;
}) {
  function toMl(value: number | null, unit: VolumeUnit | null) {
    if (!value || !unit) {
      return 0;
    }

    return unit === "ml" ? value : value * 29.5735;
  }

  function formatAmount(value: number | null, unit: VolumeUnit | null) {
    if (!value || !unit) {
      return "0";
    }

    if (displayVolumeUnit === "ml") {
      return `${Math.round(unit === "ml" ? value : value * 29.5735)} ml`;
    }

    return `${(unit === "oz" ? value : value / 29.5735).toFixed(1)} oz`;
  }

  function formatTotal(totalMl: number) {
    if (totalMl <= 0) {
      return "0 ml";
    }

    return displayVolumeUnit === "ml"
      ? `${Math.round(totalMl)} ml`
      : `${(totalMl / 29.5735).toFixed(1)} oz`;
  }

  function formatTimeSince(value: string) {
    const now = Date.now();
    const then = new Date(value).getTime();

    if (!Number.isFinite(then)) {
      return "Unknown";
    }

    const diffMs = Math.max(0, now - then);
    const minutes = Math.floor(diffMs / 60_000);

    if (minutes < 1) {
      return "just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m ago`
        : `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return remainingHours > 0 ? `${days}d ${remainingHours}h ago` : `${days}d ago`;
  }

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
        <div className="rounded-lg border bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">Today's total</p>
          <p className="text-lg font-semibold text-foreground">
            {formatTotal(
              feeds.reduce(
                (sum, feed) =>
                  sum +
                  toMl(feed.formula_portion_volume, feed.formula_portion_unit) +
                  toMl(feed.breast_milk_portion_volume, feed.breast_milk_portion_unit),
                0,
              ),
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Formula:{" "}
            {formatTotal(
              feeds.reduce(
                (sum, feed) =>
                  sum + toMl(feed.formula_portion_volume, feed.formula_portion_unit),
                0,
              ),
            )}{" "}
            · Breast milk:{" "}
            {formatTotal(
              feeds.reduce(
                (sum, feed) =>
                  sum +
                  toMl(feed.breast_milk_portion_volume, feed.breast_milk_portion_unit),
                0,
              ),
            )}
          </p>
          {lastFeedStartedAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Last feed {formatTimeSince(lastFeedStartedAt)}
            </p>
          ) : null}
        </div>
        <div className="mt-3">
          <WeeklyStats feeds={weeklyFeeds} displayVolumeUnit={displayVolumeUnit} />
        </div>
        <div className="mt-3">
          <PumpingStats
            sessions={weeklyPumpingLogs}
            displayVolumeUnit={displayVolumeUnit}
          />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">Recent activity</p>
        {recentActivities.length > 0 ? (
          <div className="mt-3 space-y-3 pr-1">
            {recentActivities.map((activity) => {
              if (activity.type === "pumping") {
                return (
                  <div
                    key={`pumping-${activity.session.id}`}
                    className="space-y-1 rounded-lg border px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">
                        Pumped{" "}
                        {formatAmount(activity.session.volume, activity.session.unit)}
                      </p>
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                        Pump
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.session.started_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.session.household_name} ·{" "}
                      {activity.session.logger_name ?? "Unknown caregiver"}
                    </p>
                  </div>
                );
              }

              const feed = activity.feed;
              const hasFormula =
                !!feed.formula_portion_volume && feed.formula_portion_volume > 0;
              const hasBreastMilk =
                !!feed.breast_milk_portion_volume &&
                feed.breast_milk_portion_volume > 0;
              const totalMl =
                toMl(feed.formula_portion_volume, feed.formula_portion_unit) +
                toMl(feed.breast_milk_portion_volume, feed.breast_milk_portion_unit);

              return (
                <div key={feed.id} className="space-y-2 rounded-lg border px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{formatTotal(totalMl)}</p>
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                        Feed
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(feed.started_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {feed.household_name} · {feed.logger_name ?? "Unknown caregiver"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {hasFormula ? (
                      <p className="text-xs text-muted-foreground">
                        Formula:{" "}
                        {formatAmount(
                          feed.formula_portion_volume,
                          feed.formula_portion_unit,
                        )}
                      </p>
                    ) : null}
                    {hasBreastMilk ? (
                      <p className="text-xs text-muted-foreground">
                        Breast milk:{" "}
                        {formatAmount(
                          feed.breast_milk_portion_volume,
                          feed.breast_milk_portion_unit,
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
