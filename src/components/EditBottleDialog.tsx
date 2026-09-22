import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import type { FeedsActions, FeedsState } from "./FeedLogList";

const ML_PER_OZ = 29.5735;
const MAX_PORTION_OZ = 60;

function getMaxPortionVolume(unit: "oz" | "ml") {
  return unit === "oz" ? MAX_PORTION_OZ : Math.round(MAX_PORTION_OZ * ML_PER_OZ);
}

export function EditBottleDialog({
  state,
  actions,
}: {
  state: FeedsState;
  actions: FeedsActions;
}) {
  const open = state.edit.editingFeedId !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) actions.onCancelFeedEdit();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit bottle</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={actions.onSubmitFeedUpdate}>
          <div className="space-y-1">
            <Label htmlFor="edit-feed-time">Time</Label>
            <Input
              id="edit-feed-time"
              type="datetime-local"
              value={state.edit.startedAt}
              onChange={(e) => actions.onEditStartedAtChange(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label>Amount ({state.edit.volumeUnit})</Label>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              <Button
                type="button"
                size="sm"
                variant={state.edit.volumeUnit === "oz" ? "default" : "ghost"}
                className="h-7"
                onClick={() => actions.onEditVolumeUnitChange("oz")}
              >
                oz
              </Button>
              <Button
                type="button"
                size="sm"
                variant={state.edit.volumeUnit === "ml" ? "default" : "ghost"}
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
              max={getMaxPortionVolume(state.edit.volumeUnit)}
              step="0.1"
              placeholder="Formula"
              value={state.edit.formulaVolume}
              onChange={(e) => actions.onEditFormulaVolumeChange(e.target.value)}
            />
            <Input
              aria-label="Breast milk amount"
              type="number"
              min="0"
              max={getMaxPortionVolume(state.edit.volumeUnit)}
              step="0.1"
              placeholder="Breast milk"
              value={state.edit.breastMilkVolume}
              onChange={(e) => actions.onEditBreastMilkVolumeChange(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={state.edit.isUpdating}>
              {state.edit.isUpdating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={actions.onCancelFeedEdit}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
