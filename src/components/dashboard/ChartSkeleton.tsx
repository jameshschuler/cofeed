import { cn } from "../../lib/utils";

export function ChartSkeleton({
  label,
  chartHeightClass,
  withMetricTabs = false,
}: {
  label: string;
  chartHeightClass: string;
  withMetricTabs?: boolean;
}) {
  return (
    <div className="animate-pulse space-y-3">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="flex items-center justify-between gap-2">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-8 w-16 rounded-lg bg-muted" />
      </div>
      {withMetricTabs ? (
        <div aria-hidden="true" className="h-8 w-full rounded-lg bg-muted" />
      ) : null}
      <div
        aria-hidden="true"
        className={cn("w-full rounded-md bg-muted/60", chartHeightClass)}
      />
    </div>
  );
}
