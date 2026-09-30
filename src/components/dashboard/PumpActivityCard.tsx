import { useDashboardContext } from "../../contexts/dashboard-context";
import { formatPortion, formatTime } from "../../lib/activity-format";
import { cn } from "../../lib/utils";
import type { PumpingLogItem } from "../../types/route-types";
import { SourceBadge } from "../activity/SourceBadge";
import { ActivityHeader } from "./ActivityHeader";
import { ACTIVITY_STYLES } from "./activity-styles";

export function PumpActivityCard({ session }: { session: PumpingLogItem }) {
  const { state } = useDashboardContext();

  return (
    <div
      className={cn(
        "space-y-1 rounded-lg border px-4 py-3 shadow-sm",
        ACTIVITY_STYLES.pumping.card,
      )}
    >
      <ActivityHeader
        kind="pumping"
        title={`Pumped ${formatPortion(session.volume, session.unit, state.displayVolumeUnit)}`}
      />
      <p className="text-xs text-muted-foreground">{formatTime(session.started_at)}</p>
      <p className="text-xs text-muted-foreground">
        {session.household_name} · {session.logger_name ?? "Unknown caregiver"}
      </p>
      <SourceBadge source={session.source} />
    </div>
  );
}
