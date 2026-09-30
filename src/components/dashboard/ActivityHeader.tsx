import { cn } from "../../lib/utils";
import { ACTIVITY_STYLES } from "./activity-styles";

export function ActivityHeader({
  kind,
  title,
}: {
  kind: keyof typeof ACTIVITY_STYLES;
  title: string;
}) {
  const style = ACTIVITY_STYLES[kind];
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            style.icon,
          )}
        >
          <style.Icon className="size-4" />
        </span>
        <p className="text-sm font-medium">{title}</p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
          style.chip,
        )}
      >
        {style.label}
      </span>
    </div>
  );
}
