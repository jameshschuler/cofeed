import { describe, expect, it } from "vitest";
import { getZonedDayStart, getZonedDaysAgoStart } from "./timezone";

describe("timezone day boundaries", () => {
  it("uses the household timezone instead of the device timezone", () => {
    const date = new Date("2026-09-21T02:00:00.000Z");

    expect(getZonedDayStart(date, "America/Los_Angeles").toISOString()).toBe(
      "2026-09-20T07:00:00.000Z",
    );
    expect(getZonedDayStart(date, "America/New_York").toISOString()).toBe(
      "2026-09-20T04:00:00.000Z",
    );
  });

  it("handles daylight-saving transitions", () => {
    expect(
      getZonedDayStart(
        new Date("2026-03-08T18:00:00.000Z"),
        "America/New_York",
      ).toISOString(),
    ).toBe("2026-03-08T05:00:00.000Z");
    expect(
      getZonedDayStart(
        new Date("2026-03-09T18:00:00.000Z"),
        "America/New_York",
      ).toISOString(),
    ).toBe("2026-03-09T04:00:00.000Z");
  });

  it("subtracts calendar days in the household timezone", () => {
    expect(
      getZonedDaysAgoStart(
        new Date("2026-03-09T18:00:00.000Z"),
        "America/New_York",
        1,
      ).toISOString(),
    ).toBe("2026-03-08T05:00:00.000Z");
  });
});
