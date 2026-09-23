import { createFileRoute } from "@tanstack/react-router";
import { Account } from "../components/Account";
import {
  AccountProvider,
  type AccountActions,
  type AccountState,
} from "../components/account-context";
import { AuthLoading } from "../components/AuthLoading";
import { PrivateLayout } from "../components/PrivateLayout";
import { RouteShell } from "../components/RouteShell";
import { SessionRequired } from "../components/SessionRequired";
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
  } = useRouteScreen("account");

  if (!isAuthReady || !isPreferencesReady) {
    return <AuthLoading />;
  }

  if (!session) {
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
            } satisfies AccountActions
          }
        >
          <Account />
        </AccountProvider>
      </PrivateLayout>
    </RouteShell>
  );
}

export const Route = createFileRoute("/account")({
  component: AccountPage,
});
