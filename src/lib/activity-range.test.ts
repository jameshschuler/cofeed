import { describe, expect, it } from "vitest";
import { getRangeBounds } from "./activity-range";

const now = new Date("2026-09-30T04:00:00.000Z");
const timezone = "America/Los_Angeles";

describe("getRangeBounds", () => {
  it("covers the rolling last 24 hours regardless of the calendar day", () => {
    expect(getRangeBounds("last24h", null, null, timezone, now)).toEqual({
      since: new Date("2026-09-29T04:00:00.000Z"),
      until: null,
    });
  });

  it("starts today at local midnight", () => {
    expect(
      getRangeBounds("today", null, null, timezone, now).since?.toISOString(),
    ).toBe("2026-09-29T07:00:00.000Z");
  });

  it("bounds yesterday and a chosen date to whole local days", () => {
    expect(getRangeBounds("yesterday", null, null, timezone, now)).toEqual({
      since: new Date("2026-09-28T07:00:00.000Z"),
      until: new Date("2026-09-29T07:00:00.000Z"),
    });
    expect(getRangeBounds("date", "2026-09-25", null, timezone, now)).toEqual({
      since: new Date("2026-09-25T07:00:00.000Z"),
      until: new Date("2026-09-26T07:00:00.000Z"),
    });
  });
});
