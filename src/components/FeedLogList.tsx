import { useState } from "react";
import type { FormEvent } from "react";
import { Milk, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { SourceBadge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { EmptyState } from "./ui/empty-state";
import { EditBottleDialog } from "./EditBottleDialog";
import type { FeedFilter, FeedLogItem, VolumeUnit } from "../types/route-types";

export type FeedsState = {
  compose: {
    volumeUnit: VolumeUnit | null;
    startedAt: string;
    formulaPortionVolume: string;
    breastMilkPortionVolume: string;
    pumpingVolume: string;
    isSaving: boolean;
    isSavingPumping: boolean;
  };
  list: {
    filter: FeedFilter;
    selectedDate: string | null;
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
  onComposeStartedAtChange: (value: string) => void;
  onComposeFormulaPortionVolumeChange: (value: string) => void;
  onComposeBreastMilkPortionVolumeChange: (value: string) => void;
  onComposePumpingVolumeChange: (value: string) => void;
  onSubmitNewFeed: (e: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onSubmitPumping: (e: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onFeedFilterChange: (filter: FeedFilter) => void;
  onFeedDateChange: (date: string | null) => void;
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
  const [pendingDeleteFeed, setPendingDeleteFeed] = useState<FeedLogItem | null>(null);

  return (
    <div className="flex min-h-[24rem] flex-none flex-col rounded-xl border bg-background/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Recent feeds</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid grid-cols-3 overflow-hidden rounded-lg bg-muted">
            <Button
              type="button"
              size="sm"
              variant={state.list.filter === "today" ? "default" : "ghost"}
              className="h-8 rounded-none"
              onClick={() => actions.onFeedFilterChange("today")}
            >
              Today
            </Button>
            <Button
              type="button"
              size="sm"
              variant={state.list.filter === "yesterday" ? "default" : "ghost"}
              className="h-8 rounded-none"
              onClick={() => actions.onFeedFilterChange("yesterday")}
            >
              Yesterday
            </Button>
            <Button
              type="button"
              size="sm"
              variant={state.list.filter === "date" ? "default" : "ghost"}
              className="h-8 rounded-none"
              onClick={() => actions.onFeedFilterChange("date")}
            >
              Date
            </Button>
          </div>
          {state.list.filter === "date" ? (
            <Input
              type="date"
              className="h-8 w-auto text-xs"
              value={state.list.selectedDate ?? ""}
              onChange={(e) => actions.onFeedDateChange(e.target.value || null)}
            />
          ) : null}
          <div className="flex items-center rounded-lg border border-border/70 px-3 py-1.5">
            <span className="text-xs text-muted-foreground">
              Display: {preferredDisplayVolumeUnit}
            </span>
          </div>
        </div>
      </div>
      {state.list.isLoading ? (
        <div className="mt-2 space-y-6 pr-1">
          <span className="sr-only">Loading feeds…</span>
          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <section
              key={groupIndex}
              aria-hidden="true"
              className="animate-pulse space-y-3"
            >
              <div className="h-14 rounded-lg border bg-muted/30" />
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((__, cardIndex) => (
                  <div key={cardIndex} className="h-20 rounded-lg border bg-muted/20" />
                ))}
              </div>
            </section>
          ))}
        </div>
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

              {group.feeds.map((feed) => {
                return (
                  <div
                    key={feed.id}
                    className="rounded-lg border bg-background px-4 py-3"
                  >
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
                          onClick={() => setPendingDeleteFeed(feed)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <SourceBadge source={feed.source} />
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Milk}
          title="No feeds logged yet"
          description="Bottles you log will show up here."
          className="mt-2"
        />
      )}
      <EditBottleDialog state={state} actions={actions} />
      <Dialog
        open={pendingDeleteFeed !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteFeed(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this bottle log?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This can't be undone.</p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingDeleteFeed(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (pendingDeleteFeed) actions.onDeleteFeed(pendingDeleteFeed.id);
                setPendingDeleteFeed(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
