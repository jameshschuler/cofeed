import { useState } from "react";
import { Droplet, Pencil, Trash2 } from "lucide-react";
import { ActivityListHeader } from "../activity/ActivityListHeader";
import { usePumpingContext } from "../../contexts/pumping-context";
import { Button } from "../ui/button";
import { SourceBadge } from "../activity/SourceBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { EmptyState } from "../ui/empty-state";
import {
  formatDateTime,
  formatDayLabel,
  formatVolume,
  groupByLocalDay,
  toMl,
} from "../../lib/activity-format";
import type { PumpingLogItem } from "../../types/route-types";
import { EditPumpingDialog } from "./EditPumpingDialog";

export function PumpingLogList() {
  const { state, actions, displayVolumeUnit } = usePumpingContext();
  const [pendingDelete, setPendingDelete] = useState<PumpingLogItem | null>(null);

  const groups = groupByLocalDay(state.list.logs).map(({ dayKey, items }) => ({
    dayKey,
    sessions: items,
    totalMl: items.reduce(
      (sum, session) => sum + toMl(session.volume, session.unit),
      0,
    ),
  }));

  return (
    <div className="flex min-h-[24rem] flex-none flex-col rounded-xl border bg-background/70 p-4 shadow-sm">
      <ActivityListHeader
        title="Recent pumping"
        filter={state.list.filter}
        selectedDate={state.list.selectedDate}
        displayVolumeUnit={displayVolumeUnit}
        onFilterChange={actions.onFilterChange}
        onDateChange={actions.onDateChange}
      />
      {state.list.isLoading ? (
        <div className="mt-2 space-y-3 pr-1">
          <span className="sr-only">Loading pumping sessions…</span>
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              aria-hidden="true"
              className="h-20 animate-pulse rounded-lg border bg-muted/20"
            />
          ))}
        </div>
      ) : state.list.loadError ? (
        <div className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.list.loadError}
        </div>
      ) : groups.length > 0 ? (
        <div className="mt-2 space-y-6 pr-1">
          {groups.map((group) => (
            <section key={group.dayKey} className="space-y-3">
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-sm font-medium text-foreground">
                  {formatDayLabel(group.dayKey)} ·{" "}
                  {formatVolume(group.totalMl, displayVolumeUnit)} pumped
                </p>
                <p className="text-xs text-muted-foreground">
                  {group.sessions.length}{" "}
                  {group.sessions.length === 1 ? "session" : "sessions"}
                </p>
              </div>
              {group.sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border bg-background px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {formatVolume(
                          toMl(session.volume, session.unit),
                          displayVolumeUnit,
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(session.started_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.household_name} ·{" "}
                        {session.logger_name ?? "Unknown caregiver"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Edit pumping session"
                        aria-label="Edit pumping session"
                        onClick={() => actions.onStartEdit(session)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Delete pumping session"
                        aria-label="Delete pumping session"
                        disabled={state.edit.deletingPumpingId === session.id}
                        onClick={() => setPendingDelete(session)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <SourceBadge source={session.source} />
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Droplet}
          title="No pumping logged yet"
          description="Pumping sessions you log will show up here."
          className="mt-2"
        />
      )}
      <EditPumpingDialog />
      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this pumping session?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This can't be undone.</p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (pendingDelete) {
                  actions.onDelete(pendingDelete.id);
                }
                setPendingDelete(null);
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
