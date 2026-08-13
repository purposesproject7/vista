// src/shared/hooks/useVirtualList.js
import { useState, useRef, useCallback, useMemo } from 'react';

const DEFAULT_ESTIMATE = 200;

/**
 * Dependency-free row virtualizer with dynamic height measurement.
 * Renders only rows within [startIndex, endIndex] (visible rows + `overscan`
 * rows above and below), so DOM node count stays constant regardless of
 * `count`. Caller is responsible for computing `count` from already-filtered
 * data - this hook only decides what to render, never what to include.
 */
export function useVirtualList({ count, overscan = 5, estimateSize = DEFAULT_ESTIMATE }) {
  const scrollRef = useRef(null);
  const sizeCache = useRef(new Map());
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [, forceRender] = useState(0);

  const setScrollElement = useCallback((node) => {
    scrollRef.current = node;
    if (node) setViewportHeight(node.clientHeight);
  }, []);

  const onScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  const cacheVersion = sizeCache.current.size;

  const offsets = useMemo(() => {
    const arr = new Array(count + 1);
    arr[0] = 0;
    for (let i = 0; i < count; i++) {
      const h = sizeCache.current.get(i) ?? estimateSize;
      arr[i + 1] = arr[i] + h;
    }
    return arr;
    // cacheVersion is a cheap proxy for "sizeCache contents changed"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, estimateSize, cacheVersion]);

  const totalHeight = offsets[count] || 0;

  const findIndex = useCallback((target) => {
    let lo = 0;
    let hi = count;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid + 1] <= target) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }, [count, offsets]);

  const firstVisible = count === 0 ? 0 : findIndex(scrollTop);
  const lastVisible = count === 0 ? 0 : findIndex(scrollTop + viewportHeight);

  const startIndex = Math.max(0, firstVisible - overscan);
  const endIndex = Math.min(count - 1, lastVisible + overscan);

  const measureRow = useCallback((index) => (node) => {
    if (!node) return;
    const h = node.getBoundingClientRect().height;
    if (h > 0 && sizeCache.current.get(index) !== h) {
      sizeCache.current.set(index, h);
      forceRender((n) => n + 1);
    }
  }, []);

  const getOffset = useCallback((index) => offsets[index] || 0, [offsets]);

  return {
    setScrollElement,
    onScroll,
    startIndex,
    endIndex,
    totalHeight,
    getOffset,
    measureRow,
  };
}
