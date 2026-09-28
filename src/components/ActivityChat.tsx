import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import {
  Check,
  Droplet,
  Loader2,
  Milk,
  RotateCcw,
  SendHorizontal,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { MAX_ACTIVITY_TEXT_LENGTH } from "../lib/activity-text";
import type { ChatMessage } from "../lib/chat-history";
import { formatTime } from "../lib/activity-format";
import { capitalize, cn } from "../lib/utils";
import { useChatContext } from "./chat-context";
import type { VolumeUnit } from "../types/route-types";

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

function AssistantBubble({ children, tone }: { children: ReactNode; tone?: "error" }) {
  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "max-w-[85%] rounded-2xl rounded-bl-md border px-3.5 py-2.5 text-sm",
          tone === "error"
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "bg-background text-foreground",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function LoggedMessage({
  message,
  isUndoing,
  onUndo,
}: {
  message: Extract<ChatMessage, { kind: "logged" }>;
  isUndoing: boolean;
  onUndo: () => void;
}) {
  return (
    <AssistantBubble>
      <p className="mb-2 font-medium">
        {message.undone ? "Removed" : "Added"}
        {message.householdName ? (
          <span className="font-normal text-muted-foreground">
            {" "}
            {message.undone ? "from" : "to"} {message.householdName}
          </span>
        ) : null}
      </p>
      <ul className="space-y-1.5">
        {message.entries.map((entry) => {
          const Icon = entry.kind === "feed" ? Milk : Droplet;
          return (
            <li
              key={entry.id}
              className={cn(
                "flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5",
                (message.undone || message.removedIds?.includes(entry.id)) &&
                  "text-muted-foreground line-through",
              )}
            >
              <Icon className="size-4 shrink-0 text-primary" />
              <span className="flex-1">{capitalize(entry.summary)}</span>
              <span className="text-xs text-muted-foreground">
                {formatTime(entry.startedAt)}
              </span>
              {message.undone || message.removedIds?.includes(entry.id) ? null : (
                <Check className="size-4 shrink-0 text-primary" />
              )}
            </li>
          );
        })}
      </ul>
      {message.notUnderstood ? (
        <p className="mt-2 text-xs text-muted-foreground">{message.notUnderstood}</p>
      ) : null}
      {message.undone ? null : (
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7"
            disabled={isUndoing}
            onClick={onUndo}
          >
            {isUndoing ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Undo
          </Button>
        </div>
      )}
    </AssistantBubble>
  );
}

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

export function ClearChatButton() {
  const { messages, clear } = useChatContext();
  const [isConfirming, setIsConfirming] = useState(false);

  if (messages.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-9"
        aria-label="Clear chat"
        title="Clear chat"
        onClick={() => setIsConfirming(true)}
      >
        <Trash2 className="size-5 sm:size-4" />
      </Button>
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear chat history?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes the conversation from this device. Feeds and pumping sessions
            you logged stay saved.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                clear();
                setIsConfirming(false);
              }}
            >
              Clear
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
