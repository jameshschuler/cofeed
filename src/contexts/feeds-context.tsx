import { createContext, useContext, type FormEvent, type ReactNode } from "react";
import type { FeedFilter, FeedLogItem, VolumeUnit } from "../types/route-types";

export type FeedsState = {
  compose: {
    volumeUnit: VolumeUnit | null;
    startedAt: string;
    formulaPortionVolume: string;
    breastMilkPortionVolume: string;
    pumpingVolume: string;
    isSaving: boolean;
    isSavingPumping: boolean;
    targetHouseholdName: string | null;
  };
  list: {
    filter: FeedFilter;
    selectedDate: string | null;
    isLoading: boolean;
    logs: FeedLogItem[];
    loadError: string | null;
  };
  edit: {
    editingFeedId: string | null;
    startedAt: string;
    volumeUnit: VolumeUnit;
    formulaVolume: string;
    breastMilkVolume: string;
    isUpdating: boolean;
    deletingFeedId: string | null;
  };
};

export type FeedsActions = {
  onComposeVolumeUnitChange: (value: VolumeUnit) => void;
  onComposeStartedAtChange: (value: string) => void;
  onComposeFormulaPortionVolumeChange: (value: string) => void;
  onComposeBreastMilkPortionVolumeChange: (value: string) => void;
  onComposePumpingVolumeChange: (value: string) => void;
  onSubmitNewFeed: (e: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onSubmitPumping: (e: FormEvent<HTMLFormElement>) => Promise<boolean>;
  onFeedFilterChange: (filter: FeedFilter) => void;
  onFeedDateChange: (date: string | null) => void;
  onStartEditFeed: (feed: FeedLogItem) => void;
  onDeleteFeed: (feedId: string) => void;
  onEditStartedAtChange: (value: string) => void;
  onEditVolumeUnitChange: (value: VolumeUnit) => void;
  onEditFormulaVolumeChange: (value: string) => void;
  onEditBreastMilkVolumeChange: (value: string) => void;
  onSubmitFeedUpdate: (e: FormEvent<HTMLFormElement>) => void;
  onCancelFeedEdit: () => void;
};

type FeedsContextValue = {
  state: FeedsState;
  actions: FeedsActions;
  displayVolumeUnit: VolumeUnit;
};

const FeedsContext = createContext<FeedsContextValue | null>(null);

export function FeedsProvider({
  state,
  actions,
  displayVolumeUnit,
  children,
}: FeedsContextValue & { children: ReactNode }) {
  return (
    <FeedsContext.Provider value={{ state, actions, displayVolumeUnit }}>
      {children}
    </FeedsContext.Provider>
  );
}

export function useFeedsContext() {
  const context = useContext(FeedsContext);
  if (!context) {
    throw new Error("useFeedsContext must be used within FeedsProvider.");
  }
  return context;
}
