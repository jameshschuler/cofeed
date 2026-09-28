import { describe, expect, it } from "vitest";
import { describeActivity, toActivitiesToLog } from "./activity-text";

const now = new Date("2026-09-25T21:30:00.000Z");
const timezone = "America/Los_Angeles";

describe("toActivitiesToLog", () => {
  it("converts local times and keeps valid feeds and pumping sessions", () => {
    const { activities, problems } = toActivitiesToLog(
      {
        entries: [
          {
            kind: "feed",
            time: "2026-09-25T14:00",
            formula: { volume: 3, unit: "oz" },
            breastMilk: null,
          },
          { kind: "pumping", time: null, volume: 120, unit: "ml" },
        ],
        notUnderstood: null,
      },
      { now, timezone },
    );

    expect(problems).toEqual([]);
    expect(activities).toEqual([
      {
        kind: "feed",
        startedAt: new Date("2026-09-25T21:00:00.000Z"),
        formula: { volume: 3, unit: "oz" },
        breastMilk: null,
      },
      { kind: "pumping", startedAt: now, volume: 120, unit: "ml" },
    ]);
  });

  it("drops entries with future times, bad amounts or no amount", () => {
    const { activities, problems } = toActivitiesToLog(
      {
        entries: [
          { kind: "pumping", time: "2026-09-25T18:00", volume: 4, unit: "oz" },
          { kind: "pumping", time: null, volume: 0, unit: "oz" },
          {
            kind: "feed",
            time: null,
            formula: { volume: 500, unit: "oz" },
            breastMilk: null,
          },
          { kind: "feed", time: null, formula: null, breastMilk: null },
          {
            kind: "feed",
            time: "yesterday",
            formula: { volume: 2, unit: "oz" },
            breastMilk: null,
          },
        ],
        notUnderstood: null,
      },
      { now, timezone },
    );

    expect(activities).toEqual([]);
    expect(problems).toEqual([
      "a pumping session time",
      "a pumping amount of 0 oz",
      "a feed amount of 500 oz",
      "a feed without an amount",
      "a feed time",
    ]);
  });
});

describe("describeActivity", () => {
  it("summarizes feeds and pumping sessions", () => {
    expect(
      describeActivity({
        kind: "feed",
        startedAt: now,
        formula: { volume: 2, unit: "oz" },
        breastMilk: { volume: 1, unit: "oz" },
      }),
    ).toBe("fed 2 oz formula + 1 oz breast milk");
    expect(
      describeActivity({ kind: "pumping", startedAt: now, volume: 120, unit: "ml" }),
    ).toBe("pumped 120 ml");
  });
});
