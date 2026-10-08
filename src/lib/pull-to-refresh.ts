export const PULL_THRESHOLD_PX = 64;
export const PULL_MAX_PX = 96;
export const MIN_REFRESH_DISPLAY_MS = 500;

const RESISTANCE = 0.5;

// How far the content follows the finger: half the drag distance, capped so a long pull
// doesn't drag the page halfway down the screen.
export function getPullOffset(dragDistancePx: number) {
  if (dragDistancePx <= 0) {
    return 0;
  }
  return Math.min(PULL_MAX_PX, dragDistancePx * RESISTANCE);
}

export function shouldRefresh(offsetPx: number) {
  return offsetPx >= PULL_THRESHOLD_PX;
}
