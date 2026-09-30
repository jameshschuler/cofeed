import { createContext, useContext, type FormEvent, type ReactNode } from "react";
import type { FeedFilter, PumpingLogItem, VolumeUnit } from "../types/route-types";

export type PumpingState = {
  list: {
    filter: FeedFilter;
    selectedDate: string | null;
    isLoading: boolean;
    logs: PumpingLogItem[];
    loadError: string | null;
  };
  edit: {
    editingPumpingId: string | null;
    startedAt: string;
    volume: string;
    unit: VolumeUnit;
    isUpdating: boolean;
    deletingPumpingId: string | null;
  };
};

export type PumpingActions = {
  onFilterChange: (filter: FeedFilter) => void;
  onDateChange: (date: string | null) => void;
  onStartEdit: (session: PumpingLogItem) => void;
  onDelete: (pumpingLogId: string) => void;
  onEditStartedAtChange: (value: string) => void;
  onEditVolumeChange: (value: string) => void;
  onEditUnitChange: (value: VolumeUnit) => void;
  onSubmitEdit: (e: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
};

type PumpingContextValue = {
  state: PumpingState;
  actions: PumpingActions;
  displayVolumeUnit: VolumeUnit;
};

const PumpingContext = createContext<PumpingContextValue | null>(null);

export function PumpingProvider({
  state,
  actions,
  displayVolumeUnit,
  children,
}: PumpingContextValue & { children: ReactNode }) {
  return (
    <PumpingContext.Provider value={{ state, actions, displayVolumeUnit }}>
      {children}
    </PumpingContext.Provider>
  );
}

export function usePumpingContext() {
  const context = useContext(PumpingContext);
  if (!context) {
    throw new Error("usePumpingContext must be used within PumpingProvider.");
  }
  return context;
}
