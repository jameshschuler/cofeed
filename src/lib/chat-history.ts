import type { TextLogEntry } from "../types/route-types";

export const MAX_CHAT_MESSAGES = 50;

export type ChatMessage =
  | { id: string; role: "user"; text: string; sentAt: string }
  | {
      id: string;
      role: "assistant";
      kind: "logged";
      entries: TextLogEntry[];
      notUnderstood: string | null;
      householdName?: string | null;
      removedIds?: string[];
      undone: boolean;
    }
  | { id: string; role: "assistant"; kind: "not-understood"; text: string }
  | {
      id: string;
      role: "assistant";
      kind: "error";
      text: string;
      retryText: string | null;
    };

export type LoggedChatMessage = Extract<ChatMessage, { kind: "logged" }>;

export function entriesToUndo(message: LoggedChatMessage) {
  const removed = new Set(message.removedIds ?? []);
  return message.entries.filter((entry) => !removed.has(entry.id));
}

// Records which entries an undo attempt removed; the message only counts as undone
// once every entry is gone, so a partial failure can be retried for the rest.
export function applyUndoResults(
  message: LoggedChatMessage,
  removedIds: string[],
): LoggedChatMessage {
  const removed = new Set([...(message.removedIds ?? []), ...removedIds]);
  return {
    ...message,
    removedIds: Array.from(removed),
    undone: message.entries.every((entry) => removed.has(entry.id)),
  };
}

function getKey(userId: string) {
  return `cofeed:chat:${userId}`;
}

export function readChatHistory(userId: string): ChatMessage[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const value = window.localStorage.getItem(getKey(userId));
    const parsed = value ? (JSON.parse(value) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function writeChatHistory(userId: string, messages: ChatMessage[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      getKey(userId),
      JSON.stringify(messages.slice(-MAX_CHAT_MESSAGES)),
    );
  } catch {
    // Storage may be unavailable or full; the chat keeps working in memory.
  }
}
