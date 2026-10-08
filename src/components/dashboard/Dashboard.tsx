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
import { TodayFeedSummary } from "./TodayFeedSummary";
import { TodayPumpSummary } from "./TodayPumpSummary";

export function Dashboard() {
  const { state, actions } = useDashboardContext();
  const {
    weeklyFeeds,
    weeklyPumpingLogs,
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

  return (
    <div className="flex flex-col">
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
        <div className="grid gap-3 sm:grid-cols-2">
          <TodayFeedSummary />
          <TodayPumpSummary />
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
