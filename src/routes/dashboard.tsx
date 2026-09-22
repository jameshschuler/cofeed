import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/AuthLoading";
import { Dashboard } from "../components/Dashboard";
import { LogBottleDialog } from "../components/LogBottleDialog";
import { PrivateLayout } from "../components/PrivateLayout";
import { RouteShell } from "../components/RouteShell";
import { SessionRequired } from "../components/SessionRequired";
import { useRouteScreen } from "../hooks/useRouteScreen";

function DashboardPage() {
  const {
    isAuthReady,
    session,
    errorMessage,
    successMessage,
    goTo,
    displayVolumeUnit,
    isPreferencesReady,
    feedsRouteState,
    feedsRouteActions,
    weeklyFeeds,
    pumpingLogs,
    weeklyPumpingLogs,
  } = useRouteScreen("dashboard");

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
        screen="dashboard"
        errorMessage={errorMessage}
        successMessage={successMessage}
        headerAction={
          <LogBottleDialog
            state={feedsRouteState}
            actions={feedsRouteActions}
            preferredDisplayVolumeUnit={displayVolumeUnit}
          />
        }
        onNavigate={goTo}
      >
        <Dashboard
          feeds={feedsRouteState.list.logs}
          weeklyFeeds={weeklyFeeds}
          pumpingLogs={pumpingLogs}
          weeklyPumpingLogs={weeklyPumpingLogs}
          displayVolumeUnit={displayVolumeUnit}
        />
      </PrivateLayout>
    </RouteShell>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
