import { describe, expect, it } from "vitest";
import {
  ALL_HOUSEHOLDS_CACHE_KEY,
  getActivityScope,
  getListScopeKey,
} from "./activity-scope";

describe("getActivityScope", () => {
  it("queries and caches the preferred baby on the dashboard by default", () => {
    expect(getActivityScope("dashboard", "preferred", null)).toEqual({
      queryBabyId: "preferred",
      cacheKey: "preferred",
    });
  });

  it("queries and caches the viewed baby when another household is selected", () => {
    expect(getActivityScope("dashboard", "preferred", "viewed")).toEqual({
      queryBabyId: "viewed",
      cacheKey: "viewed",
    });
  });

  it("lists every household on history screens under a separate cache key", () => {
    for (const screen of ["feeds", "pumping"] as const) {
      expect(getActivityScope(screen, "preferred", "viewed")).toEqual({
        queryBabyId: null,
        cacheKey: ALL_HOUSEHOLDS_CACHE_KEY,
      });
    }
  });
});

describe("getListScopeKey", () => {
  it("identifies a list by its range", () => {
    expect(getListScopeKey("today", null)).toBe("today");
    expect(getListScopeKey("last24h", "2026-10-01")).toBe("last24h");
  });

  it("includes the picked day for date ranges", () => {
    expect(getListScopeKey("date", "2026-10-01")).toBe("date:2026-10-01");
    expect(getListScopeKey("date", "2026-10-02")).not.toBe(
      getListScopeKey("date", "2026-10-01"),
    );
  });
});
