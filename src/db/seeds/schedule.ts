import { getLocalDayKey, getRecentDays } from "../../lib/activity-format";

export const SEED_DAYS = 7;
const MINUTE_MS = 60 * 1000;

const FEEDS = [
  { hour: 1, minute: 0, formulaMl: 75, breastMilkMl: 0 },
  { hour: 4, minute: 15, formulaMl: 45, breastMilkMl: 45 },
  { hour: 7, minute: 0, formulaMl: 0, breastMilkMl: 85 },
  { hour: 10, minute: 30, formulaMl: 95, breastMilkMl: 0 },
  { hour: 13, minute: 0, formulaMl: 45, breastMilkMl: 45 },
  { hour: 16, minute: 0, formulaMl: 0, breastMilkMl: 85 },
  { hour: 19, minute: 30, formulaMl: 95, breastMilkMl: 0 },
  { hour: 22, minute: 0, formulaMl: 60, breastMilkMl: 30 },
];

const PUMPS = [
  { hour: 6, minute: 0, volumeMl: 120 },
  { hour: 14, minute: 30, volumeMl: 100 },
  { hour: 21, minute: 0, volumeMl: 140 },
];

export type SeedFeed = {
  startedAt: Date;
  formulaMl: number;
  breastMilkMl: number;
  slot: number;
};
export type SeedPump = { startedAt: Date; volumeMl: number; slot: number };

function at(day: Date, hour: number, minute: number) {
  const date = new Date(day);
  date.setHours(hour, minute, 0, 0);
  return date;
}

// Feeds and pumps for the last SEED_DAYS calendar days ending today (local time), never
// in the future. Today always gets at least one of each, even right after midnight.
export function buildSeedSchedule(now = new Date()) {
  const days = getRecentDays(SEED_DAYS, now);
  const todayStart = at(now, 0, 0);
  const todayKey = getLocalDayKey(now);
  const notFuture = (entry: { startedAt: Date }) => entry.startedAt <= now;

  const feeds: SeedFeed[] = days
    .flatMap((day, dayIndex) =>
      FEEDS.map((feed, index) => ({
        startedAt: at(day, feed.hour, feed.minute),
        formulaMl: feed.formulaMl,
        breastMilkMl: feed.breastMilkMl,
        slot: dayIndex + index,
      })),
    )
    .filter(notFuture);

  const pumps: SeedPump[] = days
    .flatMap((day, dayIndex) =>
      PUMPS.map((pump, index) => ({
        startedAt: at(day, pump.hour, pump.minute),
        volumeMl: pump.volumeMl + dayIndex * 5,
        slot: dayIndex + index,
      })),
    )
    .filter(notFuture);

  const isToday = (entry: { startedAt: Date }) =>
    getLocalDayKey(entry.startedAt) === todayKey;
  const recent = (minutesAgo: number) =>
    new Date(Math.max(now.getTime() - minutesAgo * MINUTE_MS, todayStart.getTime()));

  if (!feeds.some(isToday)) {
    feeds.push({ startedAt: recent(10), formulaMl: 60, breastMilkMl: 0, slot: 0 });
  }
  if (!pumps.some(isToday)) {
    pumps.push({ startedAt: recent(20), volumeMl: 110, slot: 0 });
  }

  return { feeds, pumps };
}
