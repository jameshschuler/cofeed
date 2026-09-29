import { createContext, useContext, type ReactNode } from "react";
import type {
  BabyProfile,
  HouseholdMember,
  HouseholdMembership,
  PreferredHouseholdPrompt,
} from "../hooks/useHouseholds";

export type HouseholdState = {
  joinCode: string;
  isJoiningHousehold: boolean;
  households: HouseholdMembership[];
  isLoadingHouseholds: boolean;
  leavingHouseholdId: string | null;
  membersByHousehold: Record<string, HouseholdMember[]>;
  removingMemberKey: string | null;
  babyProfile: BabyProfile | null;
  isSavingBabyProfile: boolean;
  preferredPrompt: PreferredHouseholdPrompt | null;
  settingPreferredId: string | null;
  renamingHouseholdId: string | null;
};

export type HouseholdActions = {
  onJoinCodeChange: (value: string) => void;
  onJoinHousehold: () => void;
  onLeaveHousehold: (householdId: string) => void;
  onRemoveMember: (householdId: string, memberUserId: string) => void;
  onSaveBabyProfile: (name: string, dateOfBirth: string) => void;
  onCopyHouseholdCode: (joinCode: string) => void;
  onSetPreferredHousehold: (householdId: string) => void;
  onDismissPreferredPrompt: () => void;
  onRenameHousehold: (householdId: string, name: string) => Promise<boolean>;
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
