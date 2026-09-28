import { createContext, useContext, type ReactNode } from "react";
import { useActivityChat } from "../hooks/useActivityChat";
import type { VolumeUnit } from "../types/route-types";

type ChatContextValue = ReturnType<typeof useActivityChat> & {
  displayVolumeUnit: VolumeUnit;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ActivityChatProvider({
  userId,
  displayVolumeUnit,
  children,
}: {
  userId: string | null;
  displayVolumeUnit: VolumeUnit;
  children: ReactNode;
}) {
  const chat = useActivityChat({ userId });
  return (
    <ChatContext.Provider value={{ ...chat, displayVolumeUnit }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ActivityChatProvider.");
  }
  return context;
}
