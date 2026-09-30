import { Pencil } from "lucide-react";
import { useHouseholdContext } from "../../contexts/household-context";
import type { HouseholdMembership } from "../../hooks/useHouseholds";
import { capitalize } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export function HouseholdCard({
  household,
  showPreferredBadge,
  onRename,
  onLeave,
  onRemoveMember,
}: {
  household: HouseholdMembership;
  showPreferredBadge: boolean;
  onRename: () => void;
  onLeave: () => void;
  onRemoveMember: (memberUserId: string) => void;
}) {
  const { state, actions } = useHouseholdContext();
  const isOwner = household.member_role === "owner";
  const members = isOwner
    ? (state.membersByHousehold[household.household_id] ?? [])
    : [];
  const isLeaving = state.leavingHouseholdId === household.household_id;
  const isSettingPreferred = state.settingPreferredId === household.household_id;
  const showActions = !household.is_preferred || !isOwner;

  return (
    <article className="overflow-hidden rounded-lg border border-border/70 bg-background shadow-xs">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium break-words text-foreground">
              {household.household_name}
            </p>
            {household.is_preferred && showPreferredBadge ? (
              <Badge className="border-primary/40 text-primary">Preferred</Badge>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {capitalize(household.member_role)} · Code{" "}
            <span className="font-mono tracking-wider">{household.join_code}</span>
          </p>
        </div>
        {isOwner ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="-mr-2 size-8 shrink-0"
            aria-label="Rename household"
            title="Rename household"
            onClick={onRename}
          >
            <Pencil className="size-4" />
          </Button>
        ) : null}
      </div>

      {members.length > 0 ? (
        <div className="space-y-2 border-t border-border/70 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">Members</p>
          <ul className="space-y-1.5">
            {members.map((member) => {
              const removingKey = `${household.household_id}:${member.user_id}`;
              return (
                <li
                  key={member.user_id}
                  className="flex min-h-7 items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {member.profile_name ?? member.email ?? "Unknown member"}
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      · {capitalize(member.member_role)}
                    </span>
                  </span>
                  {member.member_role !== "owner" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={state.removingMemberKey === removingKey}
                      onClick={() => onRemoveMember(member.user_id)}
                    >
                      {state.removingMemberKey === removingKey ? "Removing" : "Remove"}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {showActions ? (
        <div className="flex items-center justify-end gap-2 border-t border-border/70 bg-muted/30 px-4 py-2">
          {!household.is_preferred ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={state.settingPreferredId !== null}
              onClick={() => actions.onSetPreferredHousehold(household.household_id)}
            >
              {isSettingPreferred ? "Saving" : "Set as preferred"}
            </Button>
          ) : null}
          {!isOwner ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              disabled={isLeaving}
              onClick={onLeave}
            >
              {isLeaving ? "Leaving" : "Leave"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
