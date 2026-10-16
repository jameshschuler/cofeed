import { beforeEach, describe, expect, it } from "vitest";
import { readCachedVolumeUnit, writeCachedVolumeUnit } from "./preferences-cache";

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

describe("preferences cache", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: createStorage() },
    });
  });

  it("round-trips the volume unit per user", () => {
    writeCachedVolumeUnit("user-1", "ml");

    expect(readCachedVolumeUnit("user-1")).toBe("ml");
    expect(readCachedVolumeUnit("user-2")).toBeNull();
  });

  it("ignores unknown cached values", () => {
    window.localStorage.setItem("cofeed:volume-unit:user-1", "cups");

    expect(readCachedVolumeUnit("user-1")).toBeNull();
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

    expect(() => writeCachedVolumeUnit("user-1", "oz")).not.toThrow();
    expect(readCachedVolumeUnit("user-1")).toBeNull();
  });
});
