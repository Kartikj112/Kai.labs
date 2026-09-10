"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query.
 *
 * Uses useSyncExternalStore rather than the older useEffect + setState idiom:
 * matchMedia is exactly the "external store" this hook is designed for, so
 * React reads it during render instead of scheduling a second render after
 * mount. That removes the cascading-render warning and, more usefully, the
 * one-frame flash where the component renders with the wrong value first.
 *
 * The server snapshot is always `false`, so anything gated on a media query
 * renders in its default (non-matching) state during SSR and corrects on
 * hydration — which is the only correct answer, since the server cannot know
 * the viewport.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onStoreChange);
      return () => mql.removeEventListener("change", onStoreChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
