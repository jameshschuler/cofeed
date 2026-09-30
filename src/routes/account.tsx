import { createFileRoute } from "@tanstack/react-router";
import { Account } from "../components/account/Account";
import { AccountActionsSection } from "../components/account/AccountActionsSection";
import { Households } from "../components/account/Households";
import {
  HouseholdProvider,
  type HouseholdActions,
  type HouseholdState,
} from "../contexts/household-context";
import {
  AccountProvider,
  type AccountActions,
  type AccountState,
} from "../contexts/account-context";
import { PrivateLayout } from "../components/layout/PrivateLayout";
import { RouteShell } from "../components/layout/RouteShell";
import { SessionRequired } from "../components/layout/SessionRequired";
import { useRouteScreen } from "../hooks/useRouteScreen";

function AccountPage() {
  const {
    isAuthReady,
    session,
    errorMessage,
    successMessage,
    goTo,
    handleSignOut,
    profileName,
    isSavingProfileName,
    handleSaveProfileName,
    displayVolumeUnit,
    isPreferencesReady,
    isSavingPreferences,
    handleDisplayVolumeUnitChange,
    isDarkMode,
    handleToggleDarkMode,
    handleExportData,
    isImporting,
    importProgress,
    importResultMessage,
    handleImportFileChange,
    handleOpenImport,
    joinCode,
    isJoiningHousehold,
    setJoinCode,
    joinHousehold,
    handleCopyHouseholdCode,
    households,
    isLoadingHouseholds,
    leavingHouseholdId,
    leaveHousehold,
    membersByHousehold,
    removingMemberKey,
    removeMember,
    babyProfile,
    isSavingBabyProfile,
    saveBabyProfile,
    preferredPrompt,
    settingPreferredId,
    setPreferredHousehold,
    dismissPreferredPrompt,
    renamingHouseholdId,
    renameHousehold,
  } = useRouteScreen("account");

  if (isAuthReady && !session) {
    return (
      <RouteShell>
        <SessionRequired onGoToLogin={() => goTo("login")} />
      </RouteShell>
    );
  }

  return (
    <RouteShell>
      <PrivateLayout
        screen="account"
        errorMessage={errorMessage}
        successMessage={successMessage}
        onNavigate={goTo}
      >
        <AccountProvider
          state={
            {
              displayVolumeUnit,
              profileName,
              isSavingProfileName,
              isPreferencesReady,
              isSavingPreferences,
              isDarkMode,
              isImporting,
              importProgress,
              importResultMessage,
            } satisfies AccountState
          }
          actions={
            {
              onSignOut: () => void handleSignOut(),
              onSaveProfileName: (value) => void handleSaveProfileName(value),
              onDisplayVolumeUnitChange: (value) =>
                void handleDisplayVolumeUnitChange(value),
              onToggleDarkMode: handleToggleDarkMode,
              onExportData: () => void handleExportData(),
              onImportFileChange: handleImportFileChange,
              onOpenImport: handleOpenImport,
            } satisfies AccountActions
          }
        >
          <Account />
          <HouseholdProvider
            state={
              {
                joinCode,
                isJoiningHousehold,
                households,
                isLoadingHouseholds,
                leavingHouseholdId,
                membersByHousehold,
                removingMemberKey,
                babyProfile,
                isSavingBabyProfile,
                preferredPrompt,
                settingPreferredId,
                renamingHouseholdId,
              } satisfies HouseholdState
            }
            actions={
              {
                onJoinCodeChange: setJoinCode,
                onJoinHousehold: () => void joinHousehold(),
                onLeaveHousehold: (householdId) => void leaveHousehold(householdId),
                onRemoveMember: (householdId, memberUserId) =>
                  void removeMember(householdId, memberUserId),
                onSaveBabyProfile: (name, dateOfBirth) =>
                  void saveBabyProfile(name, dateOfBirth),
                onCopyHouseholdCode: handleCopyHouseholdCode,
                onSetPreferredHousehold: (householdId) =>
                  void setPreferredHousehold(householdId),
                onDismissPreferredPrompt: dismissPreferredPrompt,
                onRenameHousehold: renameHousehold,
              } satisfies HouseholdActions
            }
          >
            <Households />
          </HouseholdProvider>
          <AccountActionsSection />
        </AccountProvider>
      </PrivateLayout>
    </RouteShell>
  );
}

export const Route = createFileRoute("/account")({
  component: AccountPage,
});
