import { describe, expect, it } from "vitest";
import {
  PULL_MAX_PX,
  PULL_THRESHOLD_PX,
  getPullOffset,
  shouldRefresh,
} from "./pull-to-refresh";

describe("pull to refresh", () => {
  it("ignores upward or zero drags", () => {
    expect(getPullOffset(0)).toBe(0);
    expect(getPullOffset(-40)).toBe(0);
  });

  it("moves the content at half the drag distance, up to a cap", () => {
    expect(getPullOffset(60)).toBe(30);
    expect(getPullOffset(1000)).toBe(PULL_MAX_PX);
  });

  it("refreshes only once the pull passes the threshold", () => {
    expect(shouldRefresh(getPullOffset(PULL_THRESHOLD_PX * 2 - 1))).toBe(false);
    expect(shouldRefresh(getPullOffset(PULL_THRESHOLD_PX * 2))).toBe(true);
  });
});
