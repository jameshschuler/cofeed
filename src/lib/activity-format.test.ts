import { describe, expect, it } from "vitest";
import type { FeedLogItem, PumpingLogItem } from "../types/route-types";
import {
  formatDayLabel,
  formatPortion,
  formatTimeSince,
  formatVolume,
  getFeedVolumesMl,
  getRecentDays,
  sumFeedVolumesMl,
  getLocalDayKey,
  groupByLocalDay,
  groupFeedsByDay,
  mergeRecentActivity,
  toMl,
} from "./activity-format";

function feed(overrides: Partial<FeedLogItem>): FeedLogItem {
  return {
    id: "feed",
    started_at: "2026-09-27T12:00:00",
    created_at: "2026-09-27T12:00:00",
    formula_portion_volume: null,
    formula_portion_unit: null,
    breast_milk_portion_volume: null,
    breast_milk_portion_unit: null,
    source: "cofeed",
    household_name: "Home",
    logger_name: null,
    ...overrides,
  };
}

describe("volumes", () => {
  it("converts to ml and treats missing amounts as zero", () => {
    expect(toMl(2, "oz")).toBeCloseTo(59.147);
    expect(toMl(90, "ml")).toBe(90);
    expect(toMl(null, "oz")).toBe(0);
    expect(toMl(3, null)).toBe(0);
  });

  it("formats in the display unit", () => {
    expect(formatVolume(90, "ml")).toBe("90 ml");
    expect(formatVolume(88.72, "oz")).toBe("3.0 oz");
    expect(formatPortion(3, "oz", "ml")).toBe("89 ml");
    expect(formatPortion(null, null, "oz")).toBe("0.0 oz");
  });

  it("totals a feed's portions", () => {
    expect(
      getFeedVolumesMl(
        feed({
          formula_portion_volume: 60,
          formula_portion_unit: "ml",
          breast_milk_portion_volume: 30,
          breast_milk_portion_unit: "ml",
        }),
      ),
    ).toEqual({ formulaMl: 60, breastMilkMl: 30, totalMl: 90 });
  });
});

describe("days", () => {
  const now = new Date(2026, 8, 27, 15, 0);

  it("labels today and yesterday, otherwise the date", () => {
    expect(formatDayLabel("2026-09-27", now)).toBe("Today");
    expect(formatDayLabel("2026-09-26", now)).toBe("Yesterday");
    expect(formatDayLabel("2026-09-20", now)).not.toMatch(/Today|Yesterday/);
  });

  it("uses the local calendar date as the day key", () => {
    expect(getLocalDayKey(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("groups feeds by local day with per-day totals", () => {
    const groups = groupFeedsByDay([
      feed({
        id: "a",
        started_at: "2026-09-27T09:00:00",
        formula_portion_volume: 60,
        formula_portion_unit: "ml",
      }),
      feed({
        id: "b",
        started_at: "2026-09-27T06:00:00",
        breast_milk_portion_volume: 30,
        breast_milk_portion_unit: "ml",
      }),
      feed({
        id: "c",
        started_at: "2026-09-26T21:00:00",
        formula_portion_volume: 90,
        formula_portion_unit: "ml",
      }),
    ]);

    expect(
      groups.map((group) => [group.dayKey, group.feeds.map((item) => item.id)]),
    ).toEqual([
      ["2026-09-27", ["a", "b"]],
      ["2026-09-26", ["c"]],
    ]);
    expect(groups[0]).toMatchObject({
      totalVolumeMl: 90,
      formulaVolumeMl: 60,
      breastMilkVolumeMl: 30,
    });
  });
});

describe("time since", () => {
  const now = new Date("2026-09-27T12:00:00.000Z").getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("describes elapsed time compactly", () => {
    expect(formatTimeSince(ago(30_000), now)).toBe("just now");
    expect(formatTimeSince(ago(4 * 60_000), now)).toBe("4m ago");
    expect(formatTimeSince(ago(90 * 60_000), now)).toBe("1h 30m ago");
    expect(formatTimeSince(ago(2 * 3_600_000), now)).toBe("2h ago");
    expect(formatTimeSince(ago(27 * 3_600_000), now)).toBe("1d 3h ago");
    expect(formatTimeSince("not a date", now)).toBe("Unknown");
  });
});

describe("totals and ranges", () => {
  it("sums formula, breast milk and total across feeds", () => {
    expect(
      sumFeedVolumesMl([
        feed({ formula_portion_volume: 60, formula_portion_unit: "ml" }),
        feed({ breast_milk_portion_volume: 30, breast_milk_portion_unit: "ml" }),
      ]),
    ).toEqual({ formulaMl: 60, breastMilkMl: 30, totalMl: 90 });
  });

  it("lists recent days oldest first, ending today", () => {
    const days = getRecentDays(7, new Date(2026, 8, 27, 10));
    expect(days).toHaveLength(7);
    expect(getLocalDayKey(days[0])).toBe("2026-09-21");
    expect(getLocalDayKey(days[6])).toBe("2026-09-27");
  });
});

describe("recent activity", () => {
  const pump = (id: string, started_at: string): PumpingLogItem => ({
    id,
    started_at,
    created_at: started_at,
    volume: 120,
    unit: "ml",
    source: "cofeed",
    household_name: "Home",
    logger_name: null,
  });

  it("merges feeds and pumping newest first without dropping any", () => {
    const items = mergeRecentActivity(
      Array.from({ length: 8 }, (_, index) =>
        feed({
          id: `feed-${index}`,
          started_at: `2026-09-29T${String(10 + index)}:00:00`,
        }),
      ),
      [pump("pump-1", "2026-09-29T12:30:00"), pump("pump-2", "2026-09-29T20:00:00")],
    );

    expect(items).toHaveLength(10);
    expect(items[0]).toMatchObject({
      type: "pumping",
      started_at: "2026-09-29T20:00:00",
    });
    const times = items.map((item) => new Date(item.started_at).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("splits a window that crosses midnight into two days", () => {
    const items = mergeRecentActivity(
      [feed({ id: "late", started_at: "2026-09-29T23:00:00" })],
      [pump("early", "2026-09-30T01:00:00")],
    );

    expect(groupByLocalDay(items).map((group) => group.dayKey)).toEqual([
      "2026-09-30",
      "2026-09-29",
    ]);
  });
});
