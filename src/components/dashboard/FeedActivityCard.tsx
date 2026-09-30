import { useDashboardContext } from "../../contexts/dashboard-context";
import {
  formatPortion,
  formatTime,
  formatVolume,
  getFeedVolumesMl,
} from "../../lib/activity-format";
import { cn } from "../../lib/utils";
import type { FeedLogItem } from "../../types/route-types";
import { SourceBadge } from "../activity/SourceBadge";
import { ActivityHeader } from "./ActivityHeader";
import { ACTIVITY_STYLES } from "./activity-styles";

export function FeedActivityCard({ feed }: { feed: FeedLogItem }) {
  const { state } = useDashboardContext();
  const { displayVolumeUnit } = state;
  const hasFormula = !!feed.formula_portion_volume && feed.formula_portion_volume > 0;
  const hasBreastMilk =
    !!feed.breast_milk_portion_volume && feed.breast_milk_portion_volume > 0;
  const { totalMl } = getFeedVolumesMl(feed);

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border px-4 py-3 shadow-sm",
        ACTIVITY_STYLES.feed.card,
      )}
    >
      <div className="space-y-1">
        <ActivityHeader kind="feed" title={formatVolume(totalMl, displayVolumeUnit)} />
        <p className="text-xs text-muted-foreground">{formatTime(feed.started_at)}</p>
        <p className="text-xs text-muted-foreground">
          {feed.household_name} · {feed.logger_name ?? "Unknown caregiver"}
        </p>
        <SourceBadge source={feed.source} />
      </div>
      <div className="space-y-1">
        {hasFormula ? (
          <p className="text-xs text-muted-foreground">
            Formula:{" "}
            {formatPortion(
              feed.formula_portion_volume,
              feed.formula_portion_unit,
              displayVolumeUnit,
            )}
          </p>
        ) : null}
        {hasBreastMilk ? (
          <p className="text-xs text-muted-foreground">
            Breast milk:{" "}
            {formatPortion(
              feed.breast_milk_portion_volume,
              feed.breast_milk_portion_unit,
              displayVolumeUnit,
            )}
          </p>
        ) : null}
      </div>
      {!(hasFormula && hasBreastMilk) ? (
        <span className="inline-block rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
          {hasBreastMilk ? "Breast milk only" : "Formula only"}
        </span>
      ) : null}
    </div>
  );
}
