import { Check, Droplet, Loader2, Milk } from "lucide-react";
import { Button } from "../ui/button";
import type { ChatMessage } from "../../lib/chat-history";
import { formatTime } from "../../lib/activity-format";
import { capitalize, cn } from "../../lib/utils";
import { AssistantBubble } from "./AssistantBubble";

export function LoggedMessage({
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
