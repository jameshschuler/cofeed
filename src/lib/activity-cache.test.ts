import { beforeEach, describe, expect, it } from "vitest";
import {
  readActivityCache,
  readLastBabyId,
  writeActivityCache,
  writeLastBabyId,
} from "./activity-cache";

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size;
    },
  } satisfies Storage;
}

describe("activity cache", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: createStorage() },
    });
  });

  it("round-trips activity data with a sync timestamp", () => {
    const activity = {
      feeds: [],
      pumpingLogs: [],
      weeklyFeeds: [],
      weeklyPumpingLogs: [],
    };

    writeActivityCache("user-1", "baby-1", activity);

    expect(readActivityCache("user-1", "baby-1")).toMatchObject(activity);
    expect(readActivityCache("user-1", "baby-1")?.savedAt).toEqual(expect.any(String));
  });

  it("keeps caches isolated by user and baby", () => {
    writeActivityCache("user-1", "baby-1", {
      feeds: [],
      pumpingLogs: [],
      weeklyFeeds: [],
      weeklyPumpingLogs: [],
    });

    expect(readActivityCache("user-2", "baby-1")).toBeNull();
    expect(readActivityCache("user-1", "baby-2")).toBeNull();
  });

  it("returns null for malformed cached data", () => {
    window.localStorage.setItem("cofeed:activity:user-1:baby-1", "not-json");

    expect(readActivityCache("user-1", "baby-1")).toBeNull();
  });

  it("stores and restores the last baby id for offline profile recovery", () => {
    writeLastBabyId("user-1", "baby-1");

    expect(readLastBabyId("user-1")).toBe("baby-1");
    expect(readLastBabyId("user-2")).toBeNull();
  });

  it("does not throw when browser storage is unavailable", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: () => {
            throw new Error("storage unavailable");
          },
          setItem: () => {
            throw new Error("storage unavailable");
          },
        },
      },
    });

    expect(() => writeLastBabyId("user-1", "baby-1")).not.toThrow();
    expect(() =>
      writeActivityCache("user-1", "baby-1", {
        feeds: [],
        pumpingLogs: [],
        weeklyFeeds: [],
        weeklyPumpingLogs: [],
      }),
    ).not.toThrow();
    expect(readActivityCache("user-1", "baby-1")).toBeNull();
  });
});
