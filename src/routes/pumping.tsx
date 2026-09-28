import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/AuthLoading";
import { FeedsProvider } from "../components/feeds-context";
import { LogBottleDialog } from "../components/LogBottleDialog";
import { PrivateLayout } from "../components/PrivateLayout";
import { PumpingLogList } from "../components/PumpingLogList";
import { PumpingProvider } from "../components/pumping-context";
import { RouteShell } from "../components/RouteShell";
import { SessionRequired } from "../components/SessionRequired";
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
    pumpingRouteState,
    pumpingRouteActions,
  } = useRouteScreen("pumping");

  if (
    !isAuthReady ||
    !isPreferencesReady ||
    feedsRouteState.compose.volumeUnit === null
  ) {
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
          screen="pumping"
          errorMessage={errorMessage}
          successMessage={successMessage}
          headerAction={<LogBottleDialog />}
          onNavigate={goTo}
        >
          <PumpingProvider
            state={pumpingRouteState}
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
