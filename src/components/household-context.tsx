import { createContext, useContext, type ReactNode } from "react";
import type { HouseholdMembership } from "../hooks/useHouseholds";

export type HouseholdState = {
  joinCode: string;
  isJoiningHousehold: boolean;
  householdJoinCode: string | null;
  households: HouseholdMembership[];
  isLoadingHouseholds: boolean;
  leavingHouseholdId: string | null;
};

export type HouseholdActions = {
  onJoinCodeChange: (value: string) => void;
  onJoinHousehold: () => void;
  onLeaveHousehold: (householdId: string) => void;
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
