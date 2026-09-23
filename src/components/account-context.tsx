import { createContext, useContext, type ChangeEvent, type ReactNode } from "react";
import type { VolumeUnit } from "../types/route-types";

export type AccountState = {
  profileName: string;
  isSavingProfileName: boolean;
  displayVolumeUnit: VolumeUnit;
  isPreferencesReady: boolean;
  isSavingPreferences: boolean;
  isDarkMode: boolean;
  isImporting: boolean;
  importProgress: { processed: number; total: number } | null;
  importResultMessage: string | null;
};

export type AccountActions = {
  onSignOut: () => void;
  onSaveProfileName: (value: string) => void;
  onDisplayVolumeUnitChange: (value: VolumeUnit) => void;
  onToggleDarkMode: () => void;
  onExportData: () => void;
  onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onOpenImport: () => void;
};

type AccountContextValue = {
  state: AccountState;
  actions: AccountActions;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({
  state,
  actions,
  children,
}: AccountContextValue & { children: ReactNode }) {
  return (
    <AccountContext.Provider value={{ state, actions }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext() {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error("useAccountContext must be used within AccountProvider.");
  }

  return context;
}
