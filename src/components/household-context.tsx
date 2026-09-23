import { createContext, useContext, type ReactNode } from "react";
import type {
  BabyProfile,
  HouseholdMember,
  HouseholdMembership,
} from "../hooks/useHouseholds";

export type HouseholdState = {
  joinCode: string;
  isJoiningHousehold: boolean;
  householdJoinCode: string | null;
  householdRole: "owner" | "caregiver" | "viewer" | null;
  households: HouseholdMembership[];
  isLoadingHouseholds: boolean;
  leavingHouseholdId: string | null;
  membersByHousehold: Record<string, HouseholdMember[]>;
  removingMemberKey: string | null;
  babyProfile: BabyProfile | null;
  isSavingBabyProfile: boolean;
};

export type HouseholdActions = {
  onJoinCodeChange: (value: string) => void;
  onJoinHousehold: () => void;
  onLeaveHousehold: (householdId: string) => void;
  onRemoveMember: (householdId: string, memberUserId: string) => void;
  onSaveBabyProfile: (name: string, dateOfBirth: string) => void;
  onCopyHouseholdCode: () => void;
};

const HouseholdContext = createContext<{
  state: HouseholdState;
  actions: HouseholdActions;
} | null>(null);

export function HouseholdProvider({
  state,
  actions,
  children,
}: {
  state: HouseholdState;
  actions: HouseholdActions;
  children: ReactNode;
}) {
  return (
    <HouseholdContext.Provider value={{ state, actions }}>
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHouseholdContext() {
  const context = useContext(HouseholdContext);

  if (!context) {
    throw new Error("useHouseholdContext must be used within HouseholdProvider.");
  }

  return context;
}
