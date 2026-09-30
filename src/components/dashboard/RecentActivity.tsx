import { Milk } from "lucide-react";
import { useDashboardContext } from "../../contexts/dashboard-context";
import {
  formatDayLabel,
  groupByLocalDay,
  mergeRecentActivity,
} from "../../lib/activity-format";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { FeedActivityCard } from "./FeedActivityCard";
import { PumpActivityCard } from "./PumpActivityCard";

export function RecentActivity() {
  const { state } = useDashboardContext();
  const days = groupByLocalDay(mergeRecentActivity(state.feeds, state.pumpingLogs));
  const showDayHeadings = days.length > 1;

  return (
    <section className="mt-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Recent activity</p>
        <p className="text-xs text-muted-foreground">Last 24 hours</p>
      </div>
      {state.isLoadingActivity ? (
        <div className="mt-3 space-y-3 pr-1">
          <span className="sr-only">Loading recent activity…</span>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg border bg-muted/20" />
          ))}
        </div>
      ) : days.length > 0 ? (
        <div className="mt-3 space-y-5 pr-1">
          {days.map((day) => (
            <div key={day.dayKey} className="space-y-3">
              {showDayHeadings ? (
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {formatDayLabel(day.dayKey)}
                </p>
              ) : null}
              {day.items.map((item) =>
                item.type === "feed" ? (
                  <FeedActivityCard key={`feed-${item.feed.id}`} feed={item.feed} />
                ) : (
                  <PumpActivityCard
                    key={`pumping-${item.session.id}`}
                    session={item.session}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Milk}
          title="Nothing logged in the last 24 hours"
          description="Tap + to log a feed or pumping session."
          className="mt-3"
        />
      )}
    </section>
  );
}
