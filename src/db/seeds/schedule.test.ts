import { describe, expect, it } from "vitest";
import { getLocalDayKey } from "../../lib/activity-format";
import { SEED_DAYS, buildSeedSchedule } from "./schedule";

function dayKeys(entries: Array<{ startedAt: Date }>) {
  return new Set(entries.map((entry) => getLocalDayKey(entry.startedAt)));
}

describe("buildSeedSchedule", () => {
  it("covers the last 7 days including today, with feeds and pumps every day", () => {
    const now = new Date(2026, 8, 30, 15, 0);
    const { feeds, pumps } = buildSeedSchedule(now);
    const expectedDays = Array.from({ length: SEED_DAYS }, (_, index) =>
      getLocalDayKey(new Date(2026, 8, 24 + index)),
    );

    expect([...dayKeys(feeds)].sort()).toEqual(expectedDays);
    expect([...dayKeys(pumps)].sort()).toEqual(expectedDays);
  });

  it("never schedules anything after the time the seed runs", () => {
    const now = new Date(2026, 8, 30, 15, 0);
    const { feeds, pumps } = buildSeedSchedule(now);

    expect([...feeds, ...pumps].every((entry) => entry.startedAt <= now)).toBe(true);
  });

  it("still gives today a feed and a pump right after midnight", () => {
    const now = new Date(2026, 8, 30, 0, 5);
    const { feeds, pumps } = buildSeedSchedule(now);
    const today = getLocalDayKey(now);

    expect(dayKeys(feeds).has(today)).toBe(true);
    expect(dayKeys(pumps).has(today)).toBe(true);
    expect([...feeds, ...pumps].every((entry) => entry.startedAt <= now)).toBe(true);
  });
});
