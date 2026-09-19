import { Clipboard } from "lucide-react";
import { useHouseholdContext } from "./household-context";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function Households() {
  const { state, actions } = useHouseholdContext();
  const uniqueHouseholds = Array.from(
    new Map(
      state.households.map((household) => [household.household_id, household]),
    ).values(),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-2 sm:gap-8 sm:py-3">
      <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Your households</p>
        <div className="mt-5 space-y-3">
          {state.isLoadingHouseholds ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : uniqueHouseholds.length > 0 ? (
            <div className="space-y-3">
              {uniqueHouseholds.map((household) => (
                <div
                  key={`${household.household_id}-${household.member_role}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {household.household_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {household.member_role} · {household.join_code}
                    </p>
                  </div>
                  {household.member_role === "owner" ? (
                    <span className="text-xs font-medium text-muted-foreground">
                      Owner
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={state.leavingHouseholdId === household.household_id}
                      onClick={() => actions.onLeaveHousehold(household.household_id)}
                    >
                      {state.leavingHouseholdId === household.household_id
                        ? "Leaving"
                        : "Leave"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You are not part of a household.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Share your household</p>
        <div className="mt-5 space-y-3">
          <Label>Household code</Label>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border bg-muted/40 px-3 py-3 text-left text-sm font-medium tracking-[0.2em] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={!state.householdJoinCode}
            onClick={actions.onCopyHouseholdCode}
            title="Copy household code"
          >
            <span>{state.householdJoinCode ?? "Loading"}</span>
            <Clipboard className="size-4" />
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Join a household</p>
        <div className="mt-5 space-y-3">
          <Label htmlFor="household-join-code">Household code</Label>
          <div className="flex gap-2">
            <Input
              id="household-join-code"
              className="uppercase"
              maxLength={6}
              placeholder="ABC123"
              value={state.joinCode}
              onChange={(event) => actions.onJoinCodeChange(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={state.isJoiningHousehold}
              onClick={actions.onJoinHousehold}
            >
              {state.isJoiningHousehold ? "Joining" : "Join"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
