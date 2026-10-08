import { ArrowDown, Loader2 } from "lucide-react";
import { PULL_THRESHOLD_PX, shouldRefresh } from "../../lib/pull-to-refresh";
import { cn } from "../../lib/utils";

export function PullToRefreshIndicator({
  offset,
  isPulling,
  isRefreshing,
}: {
  offset: number;
  isPulling: boolean;
  isRefreshing: boolean;
}) {
  const isReady = shouldRefresh(offset);

  return (
    <div
      aria-hidden={!isRefreshing}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden text-muted-foreground",
        !isPulling && "transition-[height] duration-200 ease-out",
      )}
      style={{ height: offset }}
    >
      {isRefreshing ? (
        <span role="status" className="flex items-center gap-2 text-xs">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="sr-only">Refreshing</span>
        </span>
      ) : (
        <ArrowDown
          className={cn(
            "size-5 transition-transform",
            isReady && "rotate-180 text-primary",
          )}
          style={{ opacity: Math.min(1, offset / PULL_THRESHOLD_PX) }}
        />
      )}
    </div>
  );
}
