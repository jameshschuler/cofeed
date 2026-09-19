import type { FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { FeedFilter, FeedLogItem, VolumeUnit } from "../types/route-types";

export type FeedsState = {
  compose: {
    volumeUnit: VolumeUnit | null;
    formulaPortionVolume: string;
    breastMilkPortionVolume: string;
    isSaving: boolean;
  };
  list: {
    filter: FeedFilter;
    isLoading: boolean;
    logs: FeedLogItem[];
    loadError: string | null;
  };
  edit: {
    editingFeedId: string | null;
    startedAt: string;
    volumeUnit: VolumeUnit;
    formulaVolume: string;
    breastMilkVolume: string;
    isUpdating: boolean;
    deletingFeedId: string | null;
  };
};

export type FeedsActions = {
  onComposeVolumeUnitChange: (value: VolumeUnit) => void;
  onComposeFormulaPortionVolumeChange: (value: string) => void;
  onComposeBreastMilkPortionVolumeChange: (value: string) => void;
  onSubmitNewFeed: (e: FormEvent<HTMLFormElement>) => void;
  onFeedFilterChange: (filter: FeedFilter) => void;
  onStartEditFeed: (feed: FeedLogItem) => void;
  onDeleteFeed: (feedId: string) => void;
  onEditStartedAtChange: (value: string) => void;
  onEditVolumeUnitChange: (value: VolumeUnit) => void;
  onEditFormulaVolumeChange: (value: string) => void;
  onEditBreastMilkVolumeChange: (value: string) => void;
  onSubmitFeedUpdate: (e: FormEvent<HTMLFormElement>) => void;
  onCancelFeedEdit: () => void;
};

type FeedGroups = Array<{
  dayKey: string;
  totalVolumeMl: number;
  formulaVolumeMl: number;
  breastMilkVolumeMl: number;
  feeds: FeedLogItem[];
}>;

export function FeedLogList({
  state,
  actions,
  groupedFeeds,
  preferredDisplayVolumeUnit,
  formatDayLabel,
  formatDailyTotal,
  formatDailyBreakdown,
  formatFeedDate,
  formatPortionVolume,
  formatVolume,
  getFeedTotalVolumeOz,
}: {
  state: FeedsState;
  actions: FeedsActions;
  groupedFeeds: FeedGroups;
  preferredDisplayVolumeUnit: VolumeUnit;
  formatDayLabel: (dayKey: string) => string;
  formatDailyTotal: (totalMl: number) => string;
  formatDailyBreakdown: (formulaMl: number, breastMilkMl: number) => string;
  formatFeedDate: (value: string) => string;
  formatPortionVolume: (value: number | null, unit: VolumeUnit | null) => string;
  formatVolume: (valueOz: number | null) => string;
  getFeedTotalVolumeOz: (feed: FeedLogItem) => number;
}) {
  return (
    <div className="flex min-h-[24rem] flex-none flex-col rounded-xl border bg-background/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Recent feeds</p>
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <Button
              type="button"
              size="sm"
              variant={state.list.filter === "today" ? "default" : "ghost"}
              className="h-7"
              onClick={() => actions.onFeedFilterChange("today")}
            >
              Today
            </Button>
            <Button
              type="button"
              size="sm"
              variant={state.list.filter === "all" ? "default" : "ghost"}
              className="h-7"
              onClick={() => actions.onFeedFilterChange("all")}
            >
              All
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <span className="px-2 py-1 text-xs text-muted-foreground">
              Display: {preferredDisplayVolumeUnit}
            </span>
          </div>
        </div>
      </div>
      {state.list.isLoading ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      ) : state.list.logs.length > 0 ? (
        <div className="mt-2 space-y-6 pr-1">
          {groupedFeeds.map((group) => (
            <section key={group.dayKey} className="space-y-3">
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-sm font-medium text-foreground">
                  {formatDayLabel(group.dayKey)} ·{" "}
                  {formatDailyTotal(group.totalVolumeMl)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDailyBreakdown(
                    group.formulaVolumeMl,
                    group.breastMilkVolumeMl,
                  )}
                </p>
              </div>

              {group.feeds.map((feed) => (
                <div
                  key={feed.id}
                  className="rounded-lg border bg-background px-4 py-3"
                >
                  {state.edit.editingFeedId === feed.id ? (
                    <form className="space-y-3" onSubmit={actions.onSubmitFeedUpdate}>
                      <div className="space-y-1">
                        <Label htmlFor={`edit-feed-time-${feed.id}`}>Time</Label>
                        <Input
                          id={`edit-feed-time-${feed.id}`}
                          type="datetime-local"
                          value={state.edit.startedAt}
                          onChange={(e) =>
                            actions.onEditStartedAtChange(e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Label>Amount ({state.edit.volumeUnit})</Label>
                        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              state.edit.volumeUnit === "oz" ? "default" : "ghost"
                            }
                            className="h-7"
                            onClick={() => actions.onEditVolumeUnitChange("oz")}
                          >
                            oz
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              state.edit.volumeUnit === "ml" ? "default" : "ghost"
                            }
                            className="h-7"
                            onClick={() => actions.onEditVolumeUnitChange("ml")}
                          >
                            ml
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          aria-label="Formula amount"
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Formula"
                          value={state.edit.formulaVolume}
                          onChange={(e) =>
                            actions.onEditFormulaVolumeChange(e.target.value)
                          }
                        />
                        <Input
                          aria-label="Breast milk amount"
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Breast milk"
                          value={state.edit.breastMilkVolume}
                          onChange={(e) =>
                            actions.onEditBreastMilkVolumeChange(e.target.value)
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={state.edit.isUpdating}>
                          {state.edit.isUpdating ? "Saving" : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={actions.onCancelFeedEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {formatVolume(getFeedTotalVolumeOz(feed))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFeedDate(feed.started_at)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {feed.household_name} ·{" "}
                          {feed.logger_name ?? "Unknown caregiver"}
                        </p>
                        {feed.formula_portion_volume &&
                        feed.formula_portion_volume > 0 &&
                        !feed.breast_milk_portion_volume ? (
                          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            {formatPortionVolume(
                              feed.formula_portion_volume,
                              feed.formula_portion_unit,
                            )}
                            <span className="rounded-full border px-2 py-0.5">
                              Formula only
                            </span>
                          </p>
                        ) : !feed.formula_portion_volume &&
                          feed.breast_milk_portion_volume &&
                          feed.breast_milk_portion_volume > 0 ? (
                          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            {formatPortionVolume(
                              feed.breast_milk_portion_volume,
                              feed.breast_milk_portion_unit,
                            )}
                            <span className="rounded-full border px-2 py-0.5">
                              Breast milk only
                            </span>
                          </p>
                        ) : (
                          <>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Formula:{" "}
                              {formatPortionVolume(
                                feed.formula_portion_volume,
                                feed.formula_portion_unit,
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Breast milk:{" "}
                              {formatPortionVolume(
                                feed.breast_milk_portion_volume,
                                feed.breast_milk_portion_unit,
                              )}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          title="Edit bottle"
                          aria-label="Edit bottle"
                          onClick={() => actions.onStartEditFeed(feed)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          title="Delete bottle"
                          aria-label="Delete bottle"
                          disabled={state.edit.deletingFeedId === feed.id}
                          onClick={() => actions.onDeleteFeed(feed.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No feeds logged yet.</p>
      )}
    </div>
  );
}
