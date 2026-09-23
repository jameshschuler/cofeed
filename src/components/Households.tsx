import { useEffect, useState } from "react";
import { Clipboard, House } from "lucide-react";
import { useHouseholdContext } from "./household-context";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { EmptyState } from "./ui/empty-state";

export function Households() {
  const { state, actions } = useHouseholdContext();
  const [babyName, setBabyName] = useState("");
  const [babyDateOfBirth, setBabyDateOfBirth] = useState("");
  const [pendingConfirmation, setPendingConfirmation] = useState<
    | { type: "leave"; householdId: string }
    | { type: "remove"; householdId: string; memberUserId: string }
    | null
  >(null);
  const uniqueHouseholds = Array.from(
    new Map(
      state.households.map((household) => [household.household_id, household]),
    ).values(),
  );

  useEffect(() => {
    setBabyName(state.babyProfile?.name ?? "");
    setBabyDateOfBirth(state.babyProfile?.dateOfBirth ?? "");
  }, [state.babyProfile]);

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
                <div key={`${household.household_id}-${household.member_role}`}>
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background/60 px-4 py-3">
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
                        onClick={() =>
                          setPendingConfirmation({
                            type: "leave",
                            householdId: household.household_id,
                          })
                        }
                      >
                        {state.leavingHouseholdId === household.household_id
                          ? "Leaving"
                          : "Leave"}
                      </Button>
                    )}
                  </div>
                  {household.member_role === "owner" ? (
                    <div className="space-y-2 rounded-md border border-dashed px-3 py-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Members
                      </p>
                      {(state.membersByHousehold[household.household_id] ?? []).map(
                        (member) => (
                          <div
                            key={member.user_id}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="min-w-0 truncate">
                              {member.profile_name ?? member.email ?? "Unknown member"}
                              <span className="ml-1 text-muted-foreground">
                                · {member.member_role}
                              </span>
                            </span>
                            {member.member_role !== "owner" ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={
                                  state.removingMemberKey ===
                                  `${household.household_id}:${member.user_id}`
                                }
                                onClick={() =>
                                  setPendingConfirmation({
                                    type: "remove",
                                    householdId: household.household_id,
                                    memberUserId: member.user_id,
                                  })
                                }
                              >
                                {state.removingMemberKey ===
                                `${household.household_id}:${member.user_id}`
                                  ? "Removing"
                                  : "Remove"}
                              </Button>
                            ) : null}
                          </div>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={House}
              title="No household yet"
              description="Join with a code below, or share yours to invite someone."
            />
          )}
        </div>
      </section>

      {state.householdRole === "owner" ? (
        <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6">
          <p className="text-sm font-medium text-foreground">Invite members</p>
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
      ) : null}

      <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6">
        <p className="text-sm font-medium text-foreground">Baby profile</p>
        {state.babyProfile ? (
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              actions.onSaveBabyProfile(babyName, babyDateOfBirth);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="baby-name">Name</Label>
              <Input
                id="baby-name"
                value={babyName}
                disabled={state.householdRole !== "owner"}
                onChange={(event) => setBabyName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baby-date-of-birth">Date of birth</Label>
              <Input
                id="baby-date-of-birth"
                type="date"
                value={babyDateOfBirth}
                disabled={state.householdRole !== "owner"}
                onChange={(event) => setBabyDateOfBirth(event.target.value)}
              />
            </div>
            {state.householdRole === "owner" ? (
              <Button type="submit" disabled={state.isSavingBabyProfile}>
                {state.isSavingBabyProfile ? "Saving" : "Save"}
              </Button>
            ) : null}
          </form>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Loading baby profile...</p>
        )}
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
      <Dialog
        open={pendingConfirmation !== null}
        onOpenChange={(open) => {
          if (!open) setPendingConfirmation(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingConfirmation?.type === "remove"
                ? "Remove this household member?"
                : "Leave this household?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {pendingConfirmation?.type === "remove"
              ? "They can join again with the household code."
              : "You will need the household code to join again."}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingConfirmation(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!pendingConfirmation) return;
                if (pendingConfirmation.type === "remove") {
                  actions.onRemoveMember(
                    pendingConfirmation.householdId,
                    pendingConfirmation.memberUserId,
                  );
                } else {
                  actions.onLeaveHousehold(pendingConfirmation.householdId);
                }
                setPendingConfirmation(null);
              }}
            >
              {pendingConfirmation?.type === "remove" ? "Remove" : "Leave"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
