import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_CHAT_MESSAGES,
  applyUndoResults,
  entriesToUndo,
  type LoggedChatMessage,
  readChatHistory,
  writeChatHistory,
  type ChatMessage,
} from "./chat-history";

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size;
    },
  } satisfies Storage;
}

function userMessage(index: number): ChatMessage {
  return {
    id: `m${index}`,
    role: "user",
    text: `message ${index}`,
    sentAt: "2026-09-27T12:00:00.000Z",
  };
}

describe("chat history", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: createStorage() },
    });
  });

  it("saves and reads messages per user", () => {
    writeChatHistory("user-1", [userMessage(1)]);

    expect(readChatHistory("user-1")).toEqual([userMessage(1)]);
    expect(readChatHistory("user-2")).toEqual([]);
  });

  it("keeps only the most recent messages", () => {
    const messages = Array.from({ length: MAX_CHAT_MESSAGES + 5 }, (_, index) =>
      userMessage(index),
    );
    writeChatHistory("user-1", messages);

    const saved = readChatHistory("user-1");
    expect(saved).toHaveLength(MAX_CHAT_MESSAGES);
    expect(saved[0]).toEqual(userMessage(5));
  });

  it("ignores corrupt or missing storage", () => {
    window.localStorage.setItem("cofeed:chat:user-1", "{not json");
    expect(readChatHistory("user-1")).toEqual([]);

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: () => {
            throw new Error("blocked");
          },
          setItem: () => {
            throw new Error("blocked");
          },
        },
      },
    });
    expect(readChatHistory("user-1")).toEqual([]);
    expect(() => writeChatHistory("user-1", [userMessage(1)])).not.toThrow();
  });
});

describe("undo tracking", () => {
  const logged: LoggedChatMessage = {
    id: "a1",
    role: "assistant",
    kind: "logged",
    entries: [
      {
        kind: "feed",
        id: "feed-1",
        startedAt: "2026-09-27T12:00:00.000Z",
        summary: "fed 3 oz formula",
      },
      {
        kind: "pumping",
        id: "pump-1",
        startedAt: "2026-09-27T12:00:00.000Z",
        summary: "pumped 120 ml",
      },
    ],
    notUnderstood: null,
    undone: false,
  };

  it("keeps a partially undone message undoable for the remaining entries", () => {
    const partial = applyUndoResults(logged, ["feed-1"]);

    expect(partial.undone).toBe(false);
    expect(entriesToUndo(partial).map((entry) => entry.id)).toEqual(["pump-1"]);
  });

  it("marks the message undone once every entry is removed", () => {
    const partial = applyUndoResults(logged, ["feed-1"]);
    const done = applyUndoResults(partial, ["pump-1"]);

    expect(done.undone).toBe(true);
    expect(entriesToUndo(done)).toEqual([]);
  });

  it("treats messages saved before tracking existed as having nothing removed", () => {
    expect(entriesToUndo(logged)).toHaveLength(2);
  });
});
