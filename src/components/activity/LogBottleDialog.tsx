import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useFeedsContext } from "../../contexts/feeds-context";
import { formatVolume, toMl } from "../../lib/activity-format";
import { toDateTimeInputValue } from "../../lib/timezone";
import { getMaxPortionVolume } from "../../lib/volume";

export function LogBottleDialog() {
  const { state, actions, displayVolumeUnit } = useFeedsContext();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"bottle" | "pumping">("bottle");

  const composeVolumeUnit = state.compose.volumeUnit ?? "oz";
  const composeFormulaVolume = Number(state.compose.formulaPortionVolume) || 0;
  const composeBreastMilkVolume = Number(state.compose.breastMilkPortionVolume) || 0;
  const composeTotalVolumeMl =
    toMl(composeFormulaVolume, composeVolumeUnit) +
    toMl(composeBreastMilkVolume, composeVolumeUnit);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (await actions.onSubmitNewFeed(e)) {
      setOpen(false);
    }
  }

  async function handlePumpingSubmit(e: FormEvent<HTMLFormElement>) {
    if (await actions.onSubmitPumping(e)) {
      setOpen(false);
    }
  }

  function handleOpen() {
    actions.onComposeStartedAtChange(toDateTimeInputValue());
    setOpen(true);
  }

  return (
    <>
      <Button
        type="button"
        size="icon"
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 size-12 rounded-full shadow-lg sm:static sm:size-9 sm:rounded-md sm:shadow-xs"
        aria-label="Log activity"
        title="Log activity"
        onClick={handleOpen}
      >
        <Plus className="size-5 sm:size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "bottle" ? "Log a bottle" : "Log pumping session"}
            </DialogTitle>
            {state.compose.targetHouseholdName ? (
              <p className="text-xs text-muted-foreground">
                Logging to {state.compose.targetHouseholdName}
              </p>
            ) : null}
          </DialogHeader>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            <Button
              type="button"
              size="sm"
              variant={mode === "bottle" ? "default" : "ghost"}
              onClick={() => setMode("bottle")}
            >
              Bottle
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "pumping" ? "default" : "ghost"}
              onClick={() => setMode("pumping")}
            >
              Pumping
            </Button>
          </div>
          <form
            className="space-y-3"
            onSubmit={mode === "bottle" ? handleSubmit : handlePumpingSubmit}
          >
            <div className="space-y-1">
              <Label htmlFor="feed-started-at">Time</Label>
              <Input
                id="feed-started-at"
                type="datetime-local"
                value={state.compose.startedAt}
                onChange={(e) => actions.onComposeStartedAtChange(e.target.value)}
                required
              />
            </div>
            {mode === "bottle" ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <Label>Amount ({state.compose.volumeUnit})</Label>
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={state.compose.volumeUnit === "oz" ? "default" : "ghost"}
                      className="h-7"
                      onClick={() => actions.onComposeVolumeUnitChange("oz")}
                    >
                      oz
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={state.compose.volumeUnit === "ml" ? "default" : "ghost"}
                      className="h-7"
                      onClick={() => actions.onComposeVolumeUnitChange("ml")}
                    >
                      ml
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="feed-formula-volume">Formula</Label>
                    <Input
                      id="feed-formula-volume"
                      type="number"
                      min="0"
                      max={getMaxPortionVolume(composeVolumeUnit)}
                      step="0.1"
                      placeholder="0"
                      value={state.compose.formulaPortionVolume}
                      onChange={(e) =>
                        actions.onComposeFormulaPortionVolumeChange(e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="feed-breast-milk-volume">Breast milk</Label>
                    <Input
                      id="feed-breast-milk-volume"
                      type="number"
                      min="0"
                      max={getMaxPortionVolume(composeVolumeUnit)}
                      step="0.1"
                      placeholder="0"
                      value={state.compose.breastMilkPortionVolume}
                      onChange={(e) =>
                        actions.onComposeBreastMilkPortionVolumeChange(e.target.value)
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {formatVolume(composeTotalVolumeMl, displayVolumeUnit)}
                </p>
              </>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="pumping-volume">Pumped amount</Label>
                <Input
                  id="pumping-volume"
                  type="number"
                  min="0"
                  max={getMaxPortionVolume(composeVolumeUnit)}
                  step="0.1"
                  placeholder="0"
                  value={state.compose.pumpingVolume}
                  onChange={(e) => actions.onComposePumpingVolumeChange(e.target.value)}
                />
              </div>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  mode === "bottle"
                    ? state.compose.isSaving
                    : state.compose.isSavingPumping
                }
              >
                {(
                  mode === "bottle"
                    ? state.compose.isSaving
                    : state.compose.isSavingPumping
                ) ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving
                  </>
                ) : mode === "bottle" ? (
                  "Log Bottle"
                ) : (
                  "Log Pumping"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
