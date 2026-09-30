import { useEffect, useRef } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Loader2, RotateCcw, SendHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import { MAX_ACTIVITY_TEXT_LENGTH } from "../../lib/activity-text";
import { useChatContext } from "../../contexts/chat-context";
import type { VolumeUnit } from "../../types/route-types";
import { AssistantBubble } from "./AssistantBubble";
import { LoggedMessage } from "./LoggedMessage";

const PROMPTS: Record<VolumeUnit, { examples: string[]; placeholder: string }> = {
  oz: {
    examples: [
      "3oz formula just now",
      "Pumped 4oz at 6am",
      "2oz breast milk + 1oz formula at 3",
    ],
    placeholder: "3oz formula at 2pm, pumped 4oz",
  },
  ml: {
    examples: [
      "90ml formula just now",
      "Pumped 120ml at 6am",
      "60ml breast milk + 30ml formula at 3",
    ],
    placeholder: "90ml formula at 2pm, pumped 120ml",
  },
};

const MAX_COMPOSER_HEIGHT_PX = 160;

export function ActivityChat() {
  const {
    displayVolumeUnit,
    messages,
    draft,
    isSending,
    isOnline,
    undoingId,
    setDraft,
    send,
    retry,
    undo,
  } = useChatContext();
  const endRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, isSending]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) {
      return;
    }
    composer.style.height = "auto";
    composer.style.height = `${Math.min(composer.scrollHeight, MAX_COMPOSER_HEIGHT_PX)}px`;
  }, [draft]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send(draft);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  }

  const prompts = PROMPTS[displayVolumeUnit];
  const canSend = isOnline && !isSending && draft.trim().length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Tell CoFeed about a feed or pumping session
            </p>
            <p className="text-xs text-muted-foreground">
              Use your own words. No time means now.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {prompts.examples.map((example) => (
                <Button
                  key={example}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={!isOnline || isSending}
                  onClick={() => void send(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            if (message.role === "user") {
              return (
                <div key={message.id} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground">
                    {message.text}
                  </p>
                </div>
              );
            }
            if (message.kind === "logged") {
              return (
                <LoggedMessage
                  key={message.id}
                  message={message}
                  isUndoing={undoingId === message.id}
                  onUndo={() => void undo(message.id)}
                />
              );
            }
            if (message.kind === "error") {
              return (
                <AssistantBubble key={message.id} tone="error">
                  <p>{message.text}</p>
                  {message.retryText ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7"
                      disabled={isSending || !isOnline}
                      onClick={() => void retry(message.id)}
                    >
                      <RotateCcw className="size-3.5" />
                      Retry
                    </Button>
                  ) : null}
                </AssistantBubble>
              );
            }
            return (
              <AssistantBubble key={message.id}>
                <p>{message.text}</p>
              </AssistantBubble>
            );
          })
        )}
        {isSending ? (
          <AssistantBubble>
            <span className="flex gap-1" aria-label="Logging">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
            </span>
          </AssistantBubble>
        ) : null}
        <div ref={endRef} />
      </div>
      <form
        className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-xs"
        onSubmit={handleSubmit}
      >
        <textarea
          ref={composerRef}
          rows={1}
          maxLength={MAX_ACTIVITY_TEXT_LENGTH}
          aria-label="Describe a feed or pumping session"
          placeholder={isOnline ? prompts.placeholder : "Offline, reconnect to log"}
          className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
          value={draft}
          disabled={!isOnline}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="submit"
          size="icon"
          className="size-9 shrink-0 rounded-full"
          aria-label="Send"
          disabled={!canSend}
        >
          {isSending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizontal className="size-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
