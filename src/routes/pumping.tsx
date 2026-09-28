import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/AuthLoading";
import { LogBottleDialog } from "../components/LogBottleDialog";
import { PrivateLayout } from "../components/PrivateLayout";
import { PumpingLogList } from "../components/PumpingLogList";
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
    <RouteShell>
      <PrivateLayout
        screen="pumping"
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
        <PumpingLogList
          state={pumpingRouteState}
          actions={pumpingRouteActions}
          preferredDisplayVolumeUnit={displayVolumeUnit}
        />
      </PrivateLayout>
    </RouteShell>
  );
}

export const Route = createFileRoute("/pumping")({
  component: PumpingPage,
});
