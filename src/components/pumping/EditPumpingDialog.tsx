import { Loader2 } from "lucide-react";
import { usePumpingContext } from "../../contexts/pumping-context";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { getMaxPortionVolume } from "../../lib/volume";

export function EditPumpingDialog() {
  const { state, actions } = usePumpingContext();
  return (
    <Dialog
      open={state.edit.editingPumpingId !== null}
      onOpenChange={(open) => {
        if (!open) {
          actions.onCancelEdit();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit pumping session</DialogTitle>
        </DialogHeader>
        <form className="space-y-3" onSubmit={actions.onSubmitEdit}>
          <div className="space-y-1">
            <Label htmlFor="edit-pumping-time">Time</Label>
            <Input
              id="edit-pumping-time"
              type="datetime-local"
              value={state.edit.startedAt}
              onChange={(e) => actions.onEditStartedAtChange(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="edit-pumping-volume">Amount ({state.edit.unit})</Label>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
              {(["oz", "ml"] as const).map((unit) => (
                <Button
                  key={unit}
                  type="button"
                  size="sm"
                  variant={state.edit.unit === unit ? "default" : "ghost"}
                  className="h-7"
                  onClick={() => actions.onEditUnitChange(unit)}
                >
                  {unit}
                </Button>
              ))}
            </div>
          </div>
          <Input
            id="edit-pumping-volume"
            type="number"
            min="0"
            max={getMaxPortionVolume(state.edit.unit)}
            step="0.1"
            value={state.edit.volume}
            onChange={(e) => actions.onEditVolumeChange(e.target.value)}
            required
          />
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
            <Button type="button" variant="ghost" onClick={actions.onCancelEdit}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
