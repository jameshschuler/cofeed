import { createContext, useContext, type ReactNode } from "react";
import type { FeedLogItem, PumpingLogItem, VolumeUnit } from "../types/route-types";

export type DashboardHouseholdOption = {
  babyId: string;
  householdName: string;
  isPreferred: boolean;
};

export type DashboardState = {
  feeds: FeedLogItem[];
  weeklyFeeds: FeedLogItem[];
  pumpingLogs: PumpingLogItem[];
  weeklyPumpingLogs: PumpingLogItem[];
  isLoadingActivity: boolean;
  isLoadingWeeklyStats: boolean;
  weeklyFeedError: string | null;
  weeklyPumpingError: string | null;
  isUsingCachedActivity: boolean;
  lastSyncedAt: string | null;
  displayVolumeUnit: VolumeUnit;
  householdOptions: DashboardHouseholdOption[];
  selectedBabyId: string | null;
};

export type DashboardActions = {
  onSelectBaby: (babyId: string) => void;
};

type DashboardContextValue = { state: DashboardState; actions: DashboardActions };

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  state,
  actions,
  children,
}: DashboardContextValue & { children: ReactNode }) {
  return (
    <DashboardContext.Provider value={{ state, actions }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within DashboardProvider.");
  }
  return context;
}
