import { createFileRoute } from "@tanstack/react-router";
import { FeedsProvider } from "../contexts/feeds-context";
import { LogBottleDialog } from "../components/activity/LogBottleDialog";
import { PrivateLayout } from "../components/layout/PrivateLayout";
import { PumpingLogList } from "../components/pumping/PumpingLogList";
import { PumpingProvider } from "../contexts/pumping-context";
import { RouteShell } from "../components/layout/RouteShell";
import { SessionRequired } from "../components/layout/SessionRequired";
import { useRouteScreen } from "../hooks/useRouteScreen";

function PumpingPage() {
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
    pumpingRouteState,
    pumpingRouteActions,
  } = useRouteScreen("pumping");

  const isReady =
    isAuthReady && isPreferencesReady && feedsRouteState.compose.volumeUnit !== null;

  if (isAuthReady && !session) {
    return (
      <RouteShell>
        <SessionRequired onGoToLogin={() => goTo("login")} />
      </RouteShell>
    );
  }

  return (
    <FeedsProvider
      state={{
        ...feedsRouteState,
        list: {
          ...feedsRouteState.list,
          isLoading: !isReady || feedsRouteState.list.isLoading,
        },
      }}
      actions={feedsRouteActions}
      displayVolumeUnit={displayVolumeUnit}
    >
      <RouteShell>
        <PrivateLayout
          screen="pumping"
          errorMessage={errorMessage}
          successMessage={successMessage}
          headerAction={isReady ? <LogBottleDialog /> : undefined}
          onNavigate={goTo}
          onRefresh={isReady ? refreshActivity : undefined}
        >
          <PumpingProvider
            state={{
              ...pumpingRouteState,
              list: {
                ...pumpingRouteState.list,
                isLoading: !isReady || pumpingRouteState.list.isLoading,
              },
            }}
            actions={pumpingRouteActions}
            displayVolumeUnit={displayVolumeUnit}
          >
            <PumpingLogList />
          </PumpingProvider>
        </PrivateLayout>
      </RouteShell>
    </FeedsProvider>
  );
}

export const Route = createFileRoute("/pumping")({
  component: PumpingPage,
});
