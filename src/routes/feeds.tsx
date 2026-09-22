import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/AuthLoading";
import { Feeds } from "../components/Feeds";
import { LogBottleDialog } from "../components/LogBottleDialog";
import { PrivateLayout } from "../components/PrivateLayout";
import { RouteShell } from "../components/RouteShell";
import { SessionRequired } from "../components/SessionRequired";
import { useRouteScreen } from "../hooks/useRouteScreen";

function FeedsPage() {
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
  } = useRouteScreen("feeds");

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
        screen="feeds"
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
        <Feeds
          state={feedsRouteState}
          actions={feedsRouteActions}
          preferredDisplayVolumeUnit={displayVolumeUnit}
        />
      </PrivateLayout>
    </RouteShell>
  );
}

export const Route = createFileRoute("/feeds")({
  component: FeedsPage,
});
