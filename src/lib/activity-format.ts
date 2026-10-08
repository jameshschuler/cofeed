import type { FeedLogItem, PumpingLogItem, VolumeUnit } from "../types/route-types";
import { ML_PER_OZ } from "./volume";

export function toMl(value: number | null, unit: VolumeUnit | null) {
  if (!value || !Number.isFinite(value) || !unit) {
    return 0;
  }
  return unit === "oz" ? value * ML_PER_OZ : value;
}

export function getFeedVolumesMl(feed: FeedLogItem) {
  const formulaMl = toMl(feed.formula_portion_volume, feed.formula_portion_unit);
  const breastMilkMl = toMl(
    feed.breast_milk_portion_volume,
    feed.breast_milk_portion_unit,
  );
  return { formulaMl, breastMilkMl, totalMl: formulaMl + breastMilkMl };
}

export function toDisplayVolume(valueMl: number, displayUnit: VolumeUnit) {
  return displayUnit === "ml"
    ? Math.round(valueMl)
    : Number((valueMl / ML_PER_OZ).toFixed(1));
}

export function formatVolume(valueMl: number, displayUnit: VolumeUnit) {
  return displayUnit === "ml"
    ? `${Math.round(valueMl)} ml`
    : `${(valueMl / ML_PER_OZ).toFixed(1)} oz`;
}

export function formatPortion(
  value: number | null,
  unit: VolumeUnit | null,
  displayUnit: VolumeUnit,
) {
  return formatVolume(toMl(value, unit), displayUnit);
}

export function getLocalDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDayLabel(dayKey: string, now = new Date()) {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey === getLocalDayKey(now)) {
    return "Today";
  }
  if (dayKey === getLocalDayKey(yesterday)) {
    return "Yesterday";
  }
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function groupByLocalDay<T extends { started_at: string }>(items: T[]) {
  const groups: Array<{ dayKey: string; items: T[] }> = [];
  for (const item of items) {
    const dayKey = getLocalDayKey(new Date(item.started_at));
    const group = groups.find((existing) => existing.dayKey === dayKey);
    if (group) {
      group.items.push(item);
    } else {
      groups.push({ dayKey, items: [item] });
    }
  }
  return groups;
}

export function groupFeedsByDay(feeds: FeedLogItem[]) {
  return groupByLocalDay(feeds).map(({ dayKey, items }) => {
    const volumes = items.map(getFeedVolumesMl);
    return {
      dayKey,
      feeds: items,
      totalVolumeMl: volumes.reduce((sum, volume) => sum + volume.totalMl, 0),
      formulaVolumeMl: volumes.reduce((sum, volume) => sum + volume.formulaMl, 0),
      breastMilkVolumeMl: volumes.reduce((sum, volume) => sum + volume.breastMilkMl, 0),
    };
  });
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatTimeSince(value: string, now: number) {
  const then = new Date(value).getTime();
  if (!Number.isFinite(then)) {
    return "Unknown";
  }

  const minutes = Math.floor(Math.max(0, now - then) / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m ago`
      : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h ago` : `${days}d ago`;
}

export function sumFeedVolumesMl(feeds: FeedLogItem[]) {
  return feeds.map(getFeedVolumesMl).reduce(
    (sum, volume) => ({
      formulaMl: sum.formulaMl + volume.formulaMl,
      breastMilkMl: sum.breastMilkMl + volume.breastMilkMl,
      totalMl: sum.totalMl + volume.totalMl,
    }),
    { formulaMl: 0, breastMilkMl: 0, totalMl: 0 },
  );
}

// The last `count` calendar days ending today, oldest first.
export function getRecentDays(count: number, now = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (count - 1 - index));
    return date;
  });
}

export type RecentActivityItem =
  | { type: "feed"; started_at: string; feed: FeedLogItem }
  | { type: "pumping"; started_at: string; session: PumpingLogItem };

export function mergeRecentActivity(
  feeds: FeedLogItem[],
  pumpingLogs: PumpingLogItem[],
): RecentActivityItem[] {
  return [
    ...feeds.map((feed) => ({
      type: "feed" as const,
      started_at: feed.started_at,
      feed,
    })),
    ...pumpingLogs.map((session) => ({
      type: "pumping" as const,
      started_at: session.started_at,
      session,
    })),
  ].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

export function isOnLocalDay(value: string, dayKey: string) {
  return getLocalDayKey(new Date(value)) === dayKey;
}

export function summarizeFeeds(feeds: FeedLogItem[]) {
  const totals = sumFeedVolumesMl(feeds);
  return {
    ...totals,
    count: feeds.length,
    averageMl: feeds.length > 0 ? totals.totalMl / feeds.length : 0,
  };
}

export function summarizePumping(sessions: PumpingLogItem[]) {
  const totalMl = sessions.reduce(
    (sum, session) => sum + toMl(session.volume, session.unit),
    0,
  );
  return {
    totalMl,
    count: sessions.length,
    averageMl: sessions.length > 0 ? totalMl / sessions.length : 0,
  };
}
