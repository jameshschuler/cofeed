import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/AuthLoading";
import { Dashboard } from "../components/Dashboard";
import { DashboardProvider } from "../components/dashboard-context";
import { FeedsProvider } from "../components/feeds-context";
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
    isLoadingWeeklyStats,
    weeklyFeedError,
    weeklyPumpingError,
    isUsingCachedActivity,
    lastSyncedAt,
    households,
    dashboardBabyId,
    setDashboardBabyId,
  } = useRouteScreen("dashboard");
  const householdOptions = Array.from(
    new Map(
      households
        .filter((household) => household.baby_id)
        .map((household) => [
          household.household_id,
          {
            babyId: household.baby_id as string,
            householdName: household.household_name,
            isPreferred: household.is_preferred,
          },
        ]),
    ).values(),
  );

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
    <FeedsProvider
      state={feedsRouteState}
      actions={feedsRouteActions}
      displayVolumeUnit={displayVolumeUnit}
    >
      <RouteShell>
        <PrivateLayout
          screen="dashboard"
          errorMessage={errorMessage}
          successMessage={successMessage}
          headerAction={<LogBottleDialog />}
          onNavigate={goTo}
        >
          <DashboardProvider
            state={{
              feeds: feedsRouteState.list.logs,
              weeklyFeeds,
              pumpingLogs,
              weeklyPumpingLogs,
              isLoadingActivity: feedsRouteState.list.isLoading,
              isLoadingWeeklyStats,
              weeklyFeedError,
              weeklyPumpingError,
              isUsingCachedActivity,
              lastSyncedAt,
              displayVolumeUnit,
              householdOptions,
              selectedBabyId: dashboardBabyId,
            }}
            actions={{ onSelectBaby: setDashboardBabyId }}
          >
            <Dashboard />
          </DashboardProvider>
        </PrivateLayout>
      </RouteShell>
    </FeedsProvider>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
