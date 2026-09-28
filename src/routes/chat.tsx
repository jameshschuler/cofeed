import { createFileRoute } from "@tanstack/react-router";
import { ActivityChat, ClearChatButton } from "../components/ActivityChat";
import { AuthLoading } from "../components/AuthLoading";
import { PrivateLayout } from "../components/PrivateLayout";
import { RouteShell } from "../components/RouteShell";
import { SessionRequired } from "../components/SessionRequired";
import { useActivityChat } from "../hooks/useActivityChat";
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
  const chat = useActivityChat({ userId: session?.user?.id ?? null });

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
    <RouteShell>
      <PrivateLayout
        screen="chat"
        errorMessage={errorMessage}
        successMessage={successMessage}
        headerAction={
          chat.messages.length > 0 ? (
            <ClearChatButton onClear={chat.clear} />
          ) : undefined
        }
        onNavigate={goTo}
      >
        <ActivityChat
          displayVolumeUnit={displayVolumeUnit}
          messages={chat.messages}
          draft={chat.draft}
          isSending={chat.isSending}
          isOnline={chat.isOnline}
          undoingId={chat.undoingId}
          onDraftChange={chat.setDraft}
          onSend={(text) => void chat.send(text)}
          onRetry={(messageId) => void chat.retry(messageId)}
          onUndo={(messageId) => void chat.undo(messageId)}
        />
      </PrivateLayout>
    </RouteShell>
  );
}

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});
