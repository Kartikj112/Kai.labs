"use client";

import { useEffect, useMemo, useState } from "react";
import { useElementSize } from "@/lib/hooks/useElementSize";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { NetworkCanvas } from "./NetworkCanvas";
import type { NetworkTunables } from "./types";

export interface InteractiveNetworkProps {
  className?: string;
  /**
   * Partial overrides merged over the computed defaults below -- the fast
   * path for tuning the effect without touching simulation code. See the
   * per-field comments on `buildTunables` for what each knob does.
   */
  tunables?: Partial<NetworkTunables>;
}

/**
 * =====================================================================
 * TUNING: every knob mentioned in the brief lives in this function.
 * =====================================================================
 */
function buildTunables(
  width: number,
  height: number,
  isTouchPrimary: boolean,
  reducedMotion: boolean
): NetworkTunables {
  const area = width * height;

  // NODE COUNT -- desktop ~100-200, mobile ~40-80, scaled by viewport area
  // against a reference viewport so it doesn't explode on ultrawide monitors.
  const nodeCount = isTouchPrimary
    ? Math.round(clamp((60 * area) / (390 * 844), 40, 85))
    : Math.round(clamp((150 * area) / (1440 * 900), 90, 210));

  return {
    nodeCount,

    // CONNECTION DISTANCE -- how far apart two nodes can be and still link.
    // Larger = denser-looking web. Paired with a hard per-node cap below so
    // it never reads as a solid mesh regardless of this value.
    maxConnectionDistance: isTouchPrimary ? 120 : 155,
    maxConnectionsPerNode: 3,
    hubChance: 0.07,

    // MOVEMENT SPEED -- multiplies the drift oscillation frequency.
    driftSpeed: 1,
    // CURSOR-DRIVEN MOVEMENT -- how much the field visibly reacts as the
    // cursor moves (parallax shift + gentle node repulsion). Raised from the
    // original prototype's more conservative defaults per request.
    parallaxStrength: isTouchPrimary || reducedMotion ? 0 : 26,
    cursorRepelStrength: isTouchPrimary || reducedMotion ? 0 : 14,
    cursorRepelRadius: 130,

    // CURSOR RADIUS -- the brief's suggested range is 100-180px.
    interactionRadius: isTouchPrimary ? 110 : 150,

    // SIGNAL SPEED -- progress-units/second along an edge (1.0 = full edge
    // length per second). ~0.6 crosses a ~150px edge in about a second.
    signalSpeed: 0.6,
    signalSpawnProbability: 0.9,
    maxActiveSignals: 14,
    propagationChance: 0.35,
    maxPropagationGeneration: 2,

    // OPACITY / GLOW -- the main "how visible is this at rest" knobs.
    edgeBaseOpacity: 0.12,
    edgeLitOpacity: 0.55,
    nodeBaseOpacity: 0.5,
    polygonOpacity: 0.02, // 1-3% target from the brief
    glowIntensity: 1,

    // BACKGROUND COMPOSITION -- keep the left ~38% of the viewport (where
    // headline type lives) sparser than the rest.
    leftMargin: 0.38,
    leftMarginDensity: 0.35,

    reducedMotion,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function InteractiveNetwork({ className, tunables: overrides }: InteractiveNetworkProps) {
  const [containerRef, size] = useElementSize<HTMLDivElement>();
  const reducedMotion = usePrefersReducedMotion();
  const [isTouchPrimary, setIsTouchPrimary] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    setIsTouchPrimary(query.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouchPrimary(e.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  const tunables = useMemo<NetworkTunables>(() => {
    const base = buildTunables(size.width, size.height, isTouchPrimary, reducedMotion);
    return overrides ? { ...base, ...overrides } : base;
  }, [size.width, size.height, isTouchPrimary, reducedMotion, overrides]);

  return (
    <div ref={containerRef} className={className ?? "absolute inset-0 overflow-hidden"} aria-hidden="true">
      {size.width > 0 && size.height > 0 && (
        <NetworkCanvas width={size.width} height={size.height} containerRef={containerRef} tunables={tunables} />
      )}
    </div>
  );
}
