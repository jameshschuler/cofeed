import { useState } from "react";
import { useDashboardContext } from "../../contexts/dashboard-context";
import {
  formatTimeSince,
  formatVolume,
  getLocalDayKey,
  isOnLocalDay,
  summarizePumping,
} from "../../lib/activity-format";
import { pluralize } from "../../lib/utils";
import { Skeleton } from "../ui/skeleton";

export function TodayPumpSummary() {
  const { state } = useDashboardContext();
  const { pumpingLogs, displayVolumeUnit, isLoadingActivity } = state;
  const [now] = useState(() => Date.now());
  const todayKey = getLocalDayKey(new Date(now));
  const summary = summarizePumping(
    pumpingLogs.filter((session) => isOnLocalDay(session.started_at, todayKey)),
  );
  const lastPumpAt = pumpingLogs[0]?.started_at ?? null;

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2 shadow-sm">
      <p className="text-xs text-muted-foreground">Today's pumping</p>
      {isLoadingActivity ? (
        <div className="space-y-2 py-1">
          <span className="sr-only">Loading today's pumping…</span>
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
              ? `${pluralize(summary.count, "session")} · avg ${formatVolume(summary.averageMl, displayVolumeUnit)} per session`
              : "No pumping yet today"}
          </p>
          {lastPumpAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Last pump {formatTimeSince(lastPumpAt, now)}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
