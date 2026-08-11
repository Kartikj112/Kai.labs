"use client";

import { useEffect, useState } from "react";

/**
 * Tracks `prefers-reduced-motion`, live-updating if the user changes the OS
 * setting while the page is open (rather than reading it once on mount).
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return reduced;
}
