import { createFileRoute } from "@tanstack/react-router";
import { AuthLoading } from "../components/layout/AuthLoading";
import { Feeds } from "../components/feeds/Feeds";
import { FeedsProvider } from "../contexts/feeds-context";
import { LogBottleDialog } from "../components/activity/LogBottleDialog";
import { PrivateLayout } from "../components/layout/PrivateLayout";
import { RouteShell } from "../components/layout/RouteShell";
import { SessionRequired } from "../components/layout/SessionRequired";
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
    <FeedsProvider
      state={feedsRouteState}
      actions={feedsRouteActions}
      displayVolumeUnit={displayVolumeUnit}
    >
      <RouteShell>
        <PrivateLayout
          screen="feeds"
          errorMessage={errorMessage}
          successMessage={successMessage}
          headerAction={<LogBottleDialog />}
          onNavigate={goTo}
        >
          <Feeds />
        </PrivateLayout>
      </RouteShell>
    </FeedsProvider>
  );
}

export const Route = createFileRoute("/feeds")({
  component: FeedsPage,
});
