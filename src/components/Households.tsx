import { useEffect, useState } from "react";
import { Clipboard, House, Pencil } from "lucide-react";
import { useHouseholdContext } from "./household-context";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { EmptyState } from "./ui/empty-state";
import { householdNameSchema, MAX_HOUSEHOLD_NAME_LENGTH } from "../lib/api-contracts";

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

  const [renaming, setRenaming] = useState<{
    householdId: string;
    name: string;
  } | null>(null);
  const renameCheck = renaming ? householdNameSchema.safeParse(renaming.name) : null;
  const renameError =
    renameCheck && !renameCheck.success ? renameCheck.error.issues[0]?.message : null;
  const ownedHousehold = uniqueHouseholds.find(
    (household) => household.member_role === "owner",
  );
  const canEditBaby = state.babyProfile?.memberRole === "owner";
  const babyHouseholdName =
    uniqueHouseholds.length > 1
      ? uniqueHouseholds.find(
          (household) => household.household_id === state.babyProfile?.householdId,
        )?.household_name
      : undefined;

  useEffect(() => {
    setBabyName(state.babyProfile?.name ?? "");
    setBabyDateOfBirth(state.babyProfile?.dateOfBirth ?? "");
  }, [state.babyProfile]);

  return (
    <div className="flex flex-col gap-6 py-2 sm:gap-8 sm:py-3">
      <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6 shadow-sm">
        <p className="text-sm font-medium text-foreground">Your households</p>
        {uniqueHouseholds.length > 1 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            New feeds and pumping sessions are logged to your preferred household.
          </p>
        ) : null}
        <div className="mt-5 space-y-3">
          {state.isLoadingHouseholds ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : uniqueHouseholds.length > 0 ? (
            <div className="space-y-3">
              {uniqueHouseholds.map((household) => (
                <div key={`${household.household_id}-${household.member_role}`}>
                  <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background/60 px-4 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <span className="truncate">{household.household_name}</span>
                        {household.is_preferred && uniqueHouseholds.length > 1 ? (
                          <Badge className="border-primary/40 text-primary">
                            Preferred
                          </Badge>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {household.member_role} · {household.join_code}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!household.is_preferred ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={state.settingPreferredId !== null}
                          onClick={() =>
                            actions.onSetPreferredHousehold(household.household_id)
                          }
                        >
                          {state.settingPreferredId === household.household_id
                            ? "Saving"
                            : "Set as preferred"}
                        </Button>
                      ) : null}
                      {household.member_role === "owner" ? (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Rename household"
                            title="Rename household"
                            onClick={() =>
                              setRenaming({
                                householdId: household.household_id,
                                name: household.household_name,
                              })
                            }
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <span className="px-2 text-xs font-medium text-muted-foreground">
                            Owner
                          </span>
                        </>
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

      {ownedHousehold ? (
        <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6 shadow-sm">
          <p className="text-sm font-medium text-foreground">Invite members</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Share this code to invite people to {ownedHousehold.household_name}.
          </p>
          <div className="mt-5 space-y-3">
            <Label>Household code</Label>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md border bg-muted/40 px-3 py-3 text-left text-sm font-medium tracking-[0.2em] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => actions.onCopyHouseholdCode(ownedHousehold.join_code)}
              title="Copy household code"
            >
              <span>{ownedHousehold.join_code}</span>
              <Clipboard className="size-4" />
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6 shadow-sm">
        <p className="text-sm font-medium text-foreground">
          Baby profile
          {babyHouseholdName ? (
            <span className="font-normal text-muted-foreground">
              {" "}
              · {babyHouseholdName}
            </span>
          ) : null}
        </p>
        {state.babyProfile && canEditBaby ? (
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
                onChange={(event) => setBabyName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baby-date-of-birth">Date of birth</Label>
              <Input
                id="baby-date-of-birth"
                type="date"
                value={babyDateOfBirth}
                onChange={(event) => setBabyDateOfBirth(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={state.isSavingBabyProfile}>
              {state.isSavingBabyProfile ? "Saving" : "Save"}
            </Button>
          </form>
        ) : state.babyProfile ? (
          <div className="mt-5 space-y-3">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="font-medium text-foreground">
                  {state.babyProfile.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Date of birth</dt>
                <dd className="font-medium text-foreground">
                  {new Date(
                    `${state.babyProfile.dateOfBirth}T00:00:00`,
                  ).toLocaleDateString([], {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              Only the household owner can edit the baby profile.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Loading baby profile...</p>
        )}
      </section>

      <section className="rounded-lg border border-border/70 bg-muted/30 p-5 sm:p-6 shadow-sm">
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
          if (!open) {
            setPendingConfirmation(null);
          }
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
                if (!pendingConfirmation) {
                  return;
                }
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
      <Dialog
        open={renaming !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRenaming(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename household</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!renaming || !renameCheck?.success) {
                return;
              }
              if (
                await actions.onRenameHousehold(renaming.householdId, renameCheck.data)
              ) {
                setRenaming(null);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="household-name">Name</Label>
              <Input
                id="household-name"
                value={renaming?.name ?? ""}
                maxLength={MAX_HOUSEHOLD_NAME_LENGTH}
                autoFocus
                onChange={(event) =>
                  setRenaming((current) =>
                    current ? { ...current, name: event.target.value } : current,
                  )
                }
              />
              {renameError ? (
                <p className="text-xs text-destructive">{renameError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Everyone in the household sees this name.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setRenaming(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!renameCheck?.success || state.renamingHouseholdId !== null}
              >
                {state.renamingHouseholdId ? "Saving" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={state.preferredPrompt !== null}
        onOpenChange={(open) => {
          if (!open) {
            actions.onDismissPreferredPrompt();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Make {state.preferredPrompt?.householdName} your preferred household?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            New feeds and pumping sessions you log, from the form or the chat, will go
            to this household. You can change this anytime in your households list.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={actions.onDismissPreferredPrompt}
            >
              Not now
            </Button>
            <Button
              type="button"
              disabled={state.settingPreferredId !== null}
              onClick={() => {
                if (state.preferredPrompt) {
                  actions.onSetPreferredHousehold(state.preferredPrompt.householdId);
                }
              }}
            >
              {state.settingPreferredId ? "Saving" : "Set as preferred"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
