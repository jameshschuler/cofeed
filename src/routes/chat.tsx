import { createFileRoute } from "@tanstack/react-router";
import { ActivityChat, ClearChatButton } from "../components/ActivityChat";
import { ActivityChatProvider } from "../components/chat-context";
import { AuthLoading } from "../components/AuthLoading";
import { PrivateLayout } from "../components/PrivateLayout";
import { RouteShell } from "../components/RouteShell";
import { SessionRequired } from "../components/SessionRequired";
import { useRouteScreen } from "../hooks/useRouteScreen";

function ChatPage() {
  const {
    isAuthReady,
    session,
    errorMessage,
    successMessage,
    goTo,
    displayVolumeUnit,
    isPreferencesReady,
  } = useRouteScreen("chat");

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
    <ActivityChatProvider
      userId={session.user.id}
      displayVolumeUnit={displayVolumeUnit}
    >
      <RouteShell>
        <PrivateLayout
          screen="chat"
          errorMessage={errorMessage}
          successMessage={successMessage}
          headerAction={<ClearChatButton />}
          onNavigate={goTo}
        >
          <ActivityChat />
        </PrivateLayout>
      </RouteShell>
    </ActivityChatProvider>
  );
}

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});
