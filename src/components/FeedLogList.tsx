import { useState } from "react";
import { Milk, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { SourceBadge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { EmptyState } from "./ui/empty-state";
import { ActivityListHeader } from "./ActivityListHeader";
import { EditBottleDialog } from "./EditBottleDialog";
import { useFeedsContext } from "./feeds-context";
import {
  formatDateTime,
  formatDayLabel,
  formatPortion,
  formatVolume,
  getFeedVolumesMl,
  groupFeedsByDay,
} from "../lib/activity-format";
import type { FeedLogItem } from "../types/route-types";

export function FeedLogList() {
  const { state, actions, displayVolumeUnit } = useFeedsContext();
  const [pendingDeleteFeed, setPendingDeleteFeed] = useState<FeedLogItem | null>(null);
  const groupedFeeds = groupFeedsByDay(state.list.logs);

  return (
    <div className="flex min-h-[24rem] flex-none flex-col rounded-xl border bg-background/70 p-4 shadow-sm">
      <ActivityListHeader
        title="Recent feeds"
        filter={state.list.filter}
        selectedDate={state.list.selectedDate}
        displayVolumeUnit={displayVolumeUnit}
        onFilterChange={actions.onFeedFilterChange}
        onDateChange={actions.onFeedDateChange}
      />
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
      ) : state.list.loadError ? (
        <div className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.list.loadError}
        </div>
      ) : state.list.logs.length > 0 ? (
        <div className="mt-2 space-y-6 pr-1">
          {groupedFeeds.map((group) => (
            <section key={group.dayKey} className="space-y-3">
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-sm font-medium text-foreground">
                  {formatDayLabel(group.dayKey)} ·{" "}
                  {formatVolume(group.totalVolumeMl, displayVolumeUnit)} total
                </p>
                <p className="text-xs text-muted-foreground">
                  Formula: {formatVolume(group.formulaVolumeMl, displayVolumeUnit)} ·
                  Breast milk:{" "}
                  {formatVolume(group.breastMilkVolumeMl, displayVolumeUnit)}
                </p>
              </div>

              {group.feeds.map((feed) => {
                const { totalMl } = getFeedVolumesMl(feed);
                return (
                  <div
                    key={feed.id}
                    className="rounded-lg border bg-background px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {totalMl > 0
                            ? formatVolume(totalMl, displayVolumeUnit)
                            : "No volume"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(feed.started_at)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {feed.household_name} ·{" "}
                          {feed.logger_name ?? "Unknown caregiver"}
                        </p>
                        {feed.formula_portion_volume &&
                        feed.formula_portion_volume > 0 &&
                        !feed.breast_milk_portion_volume ? (
                          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            {formatPortion(
                              feed.formula_portion_volume,
                              feed.formula_portion_unit,
                              displayVolumeUnit,
                            )}
                            <span className="rounded-full border px-2 py-0.5">
                              Formula only
                            </span>
                          </p>
                        ) : !feed.formula_portion_volume &&
                          feed.breast_milk_portion_volume &&
                          feed.breast_milk_portion_volume > 0 ? (
                          <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            {formatPortion(
                              feed.breast_milk_portion_volume,
                              feed.breast_milk_portion_unit,
                              displayVolumeUnit,
                            )}
                            <span className="rounded-full border px-2 py-0.5">
                              Breast milk only
                            </span>
                          </p>
                        ) : (
                          <>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Formula:{" "}
                              {formatPortion(
                                feed.formula_portion_volume,
                                feed.formula_portion_unit,
                                displayVolumeUnit,
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Breast milk:{" "}
                              {formatPortion(
                                feed.breast_milk_portion_volume,
                                feed.breast_milk_portion_unit,
                                displayVolumeUnit,
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
      <EditBottleDialog />
      <Dialog
        open={pendingDeleteFeed !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteFeed(null);
          }
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
                if (pendingDeleteFeed) {
                  actions.onDeleteFeed(pendingDeleteFeed.id);
                }
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
