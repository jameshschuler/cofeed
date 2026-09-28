import { describe, expect, it } from "vitest";
import {
  formatZonedDateTime,
  getZonedDateStart,
  getZonedDayStart,
  getZonedDaysAgoStart,
  zonedLocalDateTimeToUtc,
} from "./timezone";

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

  it("finds the start of a calendar date in the given timezone", () => {
    expect(getZonedDateStart("2026-09-25", "America/Los_Angeles").toISOString()).toBe(
      "2026-09-25T07:00:00.000Z",
    );
    expect(getZonedDateStart("2026-09-25", "Pacific/Kiritimati").toISOString()).toBe(
      "2026-09-24T10:00:00.000Z",
    );
    expect(getZonedDateStart("2026-03-07", "America/New_York", 1).toISOString()).toBe(
      "2026-03-08T05:00:00.000Z",
    );
  });

  it("formats instants as local wall-clock time", () => {
    expect(
      formatZonedDateTime(new Date("2026-09-25T07:14:00.000Z"), "America/Los_Angeles"),
    ).toBe("2026-09-25 00:14");
  });

  it("converts local wall-clock time to UTC, including across DST", () => {
    expect(
      zonedLocalDateTimeToUtc("2026-09-25T14:00", "America/Los_Angeles")?.toISOString(),
    ).toBe("2026-09-25T21:00:00.000Z");
    expect(
      zonedLocalDateTimeToUtc("2026-03-08T01:30", "America/New_York")?.toISOString(),
    ).toBe("2026-03-08T06:30:00.000Z");
    expect(
      zonedLocalDateTimeToUtc("2026-03-08T03:30", "America/New_York")?.toISOString(),
    ).toBe("2026-03-08T07:30:00.000Z");
  });

  it("rejects malformed local times", () => {
    expect(zonedLocalDateTimeToUtc("2pm", "America/New_York")).toBeNull();
    expect(zonedLocalDateTimeToUtc("2026-09-25 14:00", "America/New_York")).toBeNull();
  });
});
