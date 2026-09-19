import type { FeedLogItem, VolumeUnit } from "../types/route-types";
import { FeedLogList, type FeedsActions, type FeedsState } from "./FeedLogList";

const ML_PER_OZ = 29.5735;

export type { FeedsActions, FeedsState } from "./FeedLogList";

export function Feeds({
  state,
  actions,
  preferredDisplayVolumeUnit,
}: {
  state: FeedsState;
  actions: FeedsActions;
  preferredDisplayVolumeUnit: VolumeUnit;
}) {
  function formatFeedDate(value: string) {
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getLocalDayKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDayLabel(dayKey: string) {
    const [year, month, day] = dayKey.split("-").map(Number);
    const dayDate = new Date(year, month - 1, day);
    const today = new Date();
    const todayKey = getLocalDayKey(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getLocalDayKey(yesterday);

    if (dayKey === todayKey) {
      return "Today";
    }

    if (dayKey === yesterdayKey) {
      return "Yesterday";
    }

    return dayDate.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function convertToMl(volume: number, unit: VolumeUnit) {
    if (unit === "oz") {
      return volume * ML_PER_OZ;
    }

    return volume;
  }

  function getFeedPortionVolumeMl(value: number | null, unit: VolumeUnit | null) {
    if (!value || !Number.isFinite(value) || !unit) {
      return 0;
    }

    return convertToMl(value, unit);
  }

  function getFeedTotalVolumeMl(feed: FeedLogItem) {
    return (
      getFeedPortionVolumeMl(feed.formula_portion_volume, feed.formula_portion_unit) +
      getFeedPortionVolumeMl(
        feed.breast_milk_portion_volume,
        feed.breast_milk_portion_unit,
      )
    );
  }

  function getFeedTotalVolumeOz(feed: FeedLogItem) {
    return getFeedTotalVolumeMl(feed) / ML_PER_OZ;
  }

  function formatVolumeMl(valueMl: number) {
    if (preferredDisplayVolumeUnit === "ml") {
      return `${Math.round(valueMl)} ml`;
    }

    return `${(valueMl / ML_PER_OZ).toFixed(1)} oz`;
  }

  function formatVolume(valueOz: number | null) {
    if (!valueOz || !Number.isFinite(valueOz)) {
      return "No volume";
    }

    return formatVolumeMl(valueOz * ML_PER_OZ);
  }

  function formatDailyTotal(totalMl: number) {
    return `${formatVolumeMl(totalMl)} total`;
  }

  function formatDailyBreakdown(formulaMl: number, breastMilkMl: number) {
    return `Formula: ${formatVolumeMl(formulaMl)} · Breast milk: ${formatVolumeMl(breastMilkMl)}`;
  }

  function formatPortionVolume(value: number | null, unit: VolumeUnit | null) {
    if (!value || !Number.isFinite(value) || !unit) {
      return preferredDisplayVolumeUnit === "ml" ? "0 ml" : "0.0 oz";
    }

    if (preferredDisplayVolumeUnit === "ml") {
      const valueMl = unit === "ml" ? value : value * ML_PER_OZ;
      return `${Math.round(valueMl)} ml`;
    }

    const valueOz = unit === "oz" ? value : value / ML_PER_OZ;
    return `${valueOz.toFixed(1)} oz`;
  }

  const groupedFeeds = state.list.logs.reduce<
    Array<{
      dayKey: string;
      totalVolumeMl: number;
      formulaVolumeMl: number;
      breastMilkVolumeMl: number;
      feeds: FeedLogItem[];
    }>
  >((groups, feed) => {
    const feedDate = new Date(feed.started_at);
    const dayKey = getLocalDayKey(feedDate);
    const existingGroup = groups.find((group) => group.dayKey === dayKey);
    const feedFormulaVolumeMl = getFeedPortionVolumeMl(
      feed.formula_portion_volume,
      feed.formula_portion_unit,
    );
    const feedBreastMilkVolumeMl = getFeedPortionVolumeMl(
      feed.breast_milk_portion_volume,
      feed.breast_milk_portion_unit,
    );

    if (existingGroup) {
      existingGroup.feeds.push(feed);
      existingGroup.totalVolumeMl += feedFormulaVolumeMl + feedBreastMilkVolumeMl;
      existingGroup.formulaVolumeMl += feedFormulaVolumeMl;
      existingGroup.breastMilkVolumeMl += feedBreastMilkVolumeMl;
      return groups;
    }

    groups.push({
      dayKey,
      totalVolumeMl: feedFormulaVolumeMl + feedBreastMilkVolumeMl,
      formulaVolumeMl: feedFormulaVolumeMl,
      breastMilkVolumeMl: feedBreastMilkVolumeMl,
      feeds: [feed],
    });

    return groups;
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <FeedLogList
        state={state}
        actions={actions}
        groupedFeeds={groupedFeeds}
        preferredDisplayVolumeUnit={preferredDisplayVolumeUnit}
        formatDayLabel={formatDayLabel}
        formatDailyTotal={formatDailyTotal}
        formatDailyBreakdown={formatDailyBreakdown}
        formatFeedDate={formatFeedDate}
        formatPortionVolume={formatPortionVolume}
        formatVolume={formatVolume}
        getFeedTotalVolumeOz={getFeedTotalVolumeOz}
      />

      {state.list.loadError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.list.loadError}
        </p>
      ) : null}
    </div>
  );
}
