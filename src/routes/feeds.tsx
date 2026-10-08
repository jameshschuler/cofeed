import { createFileRoute } from "@tanstack/react-router";
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
    refreshActivity,
  } = useRouteScreen("feeds");

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
          screen="feeds"
          errorMessage={errorMessage}
          successMessage={successMessage}
          headerAction={isReady ? <LogBottleDialog /> : undefined}
          onNavigate={goTo}
          onRefresh={isReady ? refreshActivity : undefined}
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
