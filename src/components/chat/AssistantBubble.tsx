import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function AssistantBubble({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "error";
}) {
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
