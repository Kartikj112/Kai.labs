"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

interface Size {
  width: number;
  height: number;
}

/**
 * Observes an element's box size. Debounced so rapid resize events (window
 * drag, devtools open/close) don't thrash canvas + simulation rebuilds.
 */
export function useElementSize<T extends HTMLElement>(): [RefObject<T | null>, Size] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame: number | null = null;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;

      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setSize({ width: Math.round(width), height: Math.round(height) });
      });
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return [ref, size];
}
