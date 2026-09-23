import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  cofeed: "CoFeed",
  nara: "Nara",
};

export function SourceBadge({ source }: { source: string }) {
  return <Badge>{SOURCE_LABELS[source] ?? source}</Badge>;
}
