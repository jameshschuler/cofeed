import { cn } from "../../lib/utils";
import { Skeleton } from "../ui/skeleton";

const BUBBLES = [
  { align: "end", width: "w-48" },
  { align: "start", width: "w-64" },
  { align: "end", width: "w-40" },
  { align: "start", width: "w-56" },
] as const;

export function ChatSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <span className="sr-only">Loading chat…</span>
      <div className="min-h-0 flex-1 space-y-3 pb-3">
        {BUBBLES.map((bubble, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              bubble.align === "end" ? "justify-end" : "justify-start",
            )}
          >
            <Skeleton className={cn("h-10 rounded-2xl", bubble.width)} />
          </div>
        ))}
      </div>
      <div className="flex items-end gap-2 rounded-2xl border bg-background p-2 shadow-xs">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="size-9 rounded-full" />
      </div>
    </div>
  );
}
