import { useEffect, useRef, useState } from "react";
import { readLastBabyId } from "../lib/activity-cache";
import { getAccessToken } from "../lib/auth-token";
import {
  MAX_CHAT_MESSAGES,
  applyUndoResults,
  entriesToUndo,
  readChatHistory,
  writeChatHistory,
  type ChatMessage,
} from "../lib/chat-history";
import { getDeviceTimezone } from "../lib/timezone";
import { deleteFeed } from "../server/feeds";
import { getProfile } from "../server/profile";
import { deletePumpingLog } from "../server/pumping";
import { logActivityFromText } from "../server/text-log";

function errorText(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useActivityChat({ userId }: { userId: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [babyId, setBabyId] = useState<string | null>(null);
  const [targetHouseholdName, setTargetHouseholdName] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const loadedForUserRef = useRef<string | null>(null);

  useEffect(() => {
    loadedForUserRef.current = null;
    setMessages(userId ? readChatHistory(userId) : []);
    loadedForUserRef.current = userId;
  }, [userId]);

  useEffect(() => {
    if (userId && loadedForUserRef.current === userId) {
      writeChatHistory(userId, messages);
    }
  }, [userId, messages]);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setBabyId(null);
      return;
    }
    let cancelled = false;
    void getAccessToken()
      .then((accessToken) =>
        getProfile({ data: { accessToken, timezone: getDeviceTimezone() } }),
      )
      .then((profile) => {
        if (!cancelled) {
          setBabyId(profile.babyId);
          setTargetHouseholdName(
            profile.householdCount > 1 ? profile.householdName : null,
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBabyId(readLastBabyId(userId));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  function append(...next: ChatMessage[]) {
    setMessages((current) => [...current, ...next].slice(-MAX_CHAT_MESSAGES));
  }

  async function logText(text: string) {
    if (!babyId) {
      append({
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "error",
        text: "Still loading your baby profile. Try again in a moment.",
        retryText: text,
      });
      return;
    }

    setIsSending(true);
    try {
      const result = await logActivityFromText({
        data: {
          accessToken: await getAccessToken(),
          babyId,
          text,
          timezone: getDeviceTimezone(),
          requestId: crypto.randomUUID(),
        },
      });
      if (result.created.length === 0) {
        append({
          id: crypto.randomUUID(),
          role: "assistant",
          kind: "not-understood",
          text:
            result.notUnderstood ?? "I couldn't find a feed or pumping amount in that.",
        });
        setDraft((current) => current || text);
        return;
      }
      append({
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "logged",
        entries: result.created,
        notUnderstood: result.notUnderstood,
        householdName: targetHouseholdName,
        undone: false,
      });
    } catch (error) {
      append({
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "error",
        text: errorText(error, "Couldn't log that."),
        retryText: text,
      });
    } finally {
      setIsSending(false);
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) {
      return;
    }
    append({
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
      sentAt: new Date().toISOString(),
    });
    setDraft("");
    await logText(trimmed);
  }

  async function retry(messageId: string) {
    const message = messages.find((item) => item.id === messageId);
    if (
      !message ||
      message.role !== "assistant" ||
      message.kind !== "error" ||
      !message.retryText ||
      isSending
    ) {
      return;
    }
    const { retryText } = message;
    setMessages((current) => current.filter((item) => item.id !== messageId));
    await logText(retryText);
  }

  async function undo(messageId: string) {
    const message = messages.find((item) => item.id === messageId);
    if (
      !message ||
      message.role !== "assistant" ||
      message.kind !== "logged" ||
      message.undone
    ) {
      return;
    }

    setUndoingId(messageId);
    try {
      const accessToken = await getAccessToken();
      const pending = entriesToUndo(message);
      const results = await Promise.allSettled(
        pending.map((entry) =>
          entry.kind === "feed"
            ? deleteFeed({ data: { accessToken, feedId: entry.id } })
            : deletePumpingLog({ data: { accessToken, pumpingLogId: entry.id } }),
        ),
      );
      const removedIds = pending
        .filter((_, index) => results[index].status === "fulfilled")
        .map((entry) => entry.id);
      setMessages((current) =>
        current.map((item) =>
          item.id === messageId && item.role === "assistant" && item.kind === "logged"
            ? applyUndoResults(item, removedIds)
            : item,
        ),
      );
      if (removedIds.length < pending.length) {
        append({
          id: crypto.randomUUID(),
          role: "assistant",
          kind: "error",
          text: "Couldn't undo everything. Tap Undo again to remove the rest.",
          retryText: null,
        });
      }
    } catch (error) {
      append({
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "error",
        text: errorText(error, "Couldn't undo that."),
        retryText: null,
      });
    } finally {
      setUndoingId(null);
    }
  }

  function clear() {
    setMessages([]);
  }

  return {
    messages,
    draft,
    setDraft,
    send,
    retry,
    undo,
    clear,
    isSending,
    undoingId,
    isOnline,
  };
}
