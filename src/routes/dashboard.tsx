import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "../components/dashboard/Dashboard";
import { DashboardProvider } from "../contexts/dashboard-context";
import { FeedsProvider } from "../contexts/feeds-context";
import { LogBottleDialog } from "../components/activity/LogBottleDialog";
import { PrivateLayout } from "../components/layout/PrivateLayout";
import { RouteShell } from "../components/layout/RouteShell";
import { SessionRequired } from "../components/layout/SessionRequired";
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
    refreshActivity,
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

  const isReady = isAuthReady && isPreferencesReady;

  if (isAuthReady && !session) {
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
          headerAction={isReady ? <LogBottleDialog /> : undefined}
          onNavigate={goTo}
          onRefresh={isReady ? refreshActivity : undefined}
        >
          <DashboardProvider
            state={{
              feeds: feedsRouteState.list.logs,
              weeklyFeeds,
              pumpingLogs,
              weeklyPumpingLogs,
              isLoadingActivity: !isReady || feedsRouteState.list.isLoading,
              isLoadingWeeklyStats: !isReady || isLoadingWeeklyStats,
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
