"use client";

import { useMediaQuery } from "./useMediaQuery";

/**
 * Tracks `prefers-reduced-motion`, live-updating if the user changes the OS
 * setting while the page is open (rather than reading it once on mount).
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
