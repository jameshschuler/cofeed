import { createFileRoute } from "@tanstack/react-router";
import { ActivityChat } from "../components/chat/ActivityChat";
import { ClearChatButton } from "../components/chat/ClearChatButton";
import { ActivityChatProvider } from "../contexts/chat-context";
import { ChatSkeleton } from "../components/chat/ChatSkeleton";
import { PrivateLayout } from "../components/layout/PrivateLayout";
import { RouteShell } from "../components/layout/RouteShell";
import { SessionRequired } from "../components/layout/SessionRequired";
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

  if (isAuthReady && !session) {
    return (
      <RouteShell>
        <SessionRequired onGoToLogin={() => goTo("login")} />
      </RouteShell>
    );
  }

  if (!isAuthReady || !isPreferencesReady || !session) {
    return (
      <RouteShell>
        <PrivateLayout
          screen="chat"
          errorMessage={errorMessage}
          successMessage={successMessage}
          onNavigate={goTo}
        >
          <ChatSkeleton />
        </PrivateLayout>
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
