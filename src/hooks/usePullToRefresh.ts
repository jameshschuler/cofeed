import { useEffect, useRef, useState, type RefObject } from "react";
import {
  MIN_REFRESH_DISPLAY_MS,
  PULL_THRESHOLD_PX,
  getPullOffset,
  shouldRefresh,
} from "../lib/pull-to-refresh";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function usePullToRefresh(
  scrollRef: RefObject<HTMLElement | null>,
  onRefresh?: () => Promise<void>,
) {
  const [offset, setOffset] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefreshRef = useRef(onRefresh);
  const isEnabled = Boolean(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !isEnabled) {
      return;
    }

    let startY: number | null = null;
    let currentOffset = 0;
    let refreshing = false;

    function reset() {
      startY = null;
      currentOffset = 0;
      setIsPulling(false);
      setOffset(0);
    }

    function handleTouchStart(event: TouchEvent) {
      if (refreshing || element!.scrollTop > 0 || event.touches.length !== 1) {
        startY = null;
        return;
      }
      startY = event.touches[0].clientY;
    }

    function handleTouchMove(event: TouchEvent) {
      if (startY === null) {
        return;
      }
      const distance = event.touches[0].clientY - startY;
      if (distance <= 0 || element!.scrollTop > 0) {
        if (currentOffset !== 0) {
          currentOffset = 0;
          setOffset(0);
        }
        return;
      }
      event.preventDefault();
      currentOffset = getPullOffset(distance);
      setIsPulling(true);
      setOffset(currentOffset);
    }

    async function handleTouchEnd() {
      if (startY === null) {
        return;
      }
      if (!shouldRefresh(currentOffset)) {
        reset();
        return;
      }
      startY = null;
      refreshing = true;
      setIsPulling(false);
      setIsRefreshing(true);
      setOffset(PULL_THRESHOLD_PX);
      try {
        await Promise.all([onRefreshRef.current?.(), wait(MIN_REFRESH_DISPLAY_MS)]);
      } finally {
        refreshing = false;
        setIsRefreshing(false);
        reset();
      }
    }

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);
    element.addEventListener("touchcancel", reset);
    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", reset);
    };
  }, [scrollRef, isEnabled]);

  return { offset, isPulling, isRefreshing };
}
