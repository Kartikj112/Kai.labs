/**
 * Core data types for the interactive network background.
 *
 * Everything in this file describes plain data, mutated in place by the
 * simulation in network.ts / signals.ts. None of it is React state — see
 * NetworkCanvas.tsx for why.
 */

export interface Node {
  id: number;

  /** World-space position in CSS pixels. Mutated every frame. */
  x: number;
  y: number;

  /** Anchor point the drift motion oscillates around. */
  anchorX: number;
  anchorY: number;

  /** 0 = far away, 1 = closest to camera. Drives size, opacity, parallax. */
  depth: number;

  /** Hub nodes render slightly larger and anchor more edges. */
  isHub: boolean;

  /** Resting radius in px before depth scaling. */
  baseRadius: number;

  /** Per-node randomized phase/frequency for the sinusoidal drift field. */
  driftSeed: DriftSeed;

  /** 0..1, brightens the node on signal arrival, decays back to 0. */
  activation: number;

  /** Small ambient sparkle offset so nodes don't pulse in lockstep. */
  twinkleSeed: number;
}

export interface DriftSeed {
  freqX1: number;
  freqX2: number;
  freqY1: number;
  freqY2: number;
  phaseX1: number;
  phaseX2: number;
  phaseY1: number;
  phaseY2: number;
  ampX: number;
  ampY: number;
}

export interface Edge {
  a: number; // Node.id / index into nodes array
  b: number;
  dist: number; // cached distance in px, refreshed on rebuild

  /** Cursor proximity, smoothed. 0 = dormant, 1 = fully lit. */
  proximity: number;
  proximityTarget: number;

  /** Cooldown (seconds) before this edge may fire another signal. */
  cooldown: number;
}

export interface Triangle {
  a: number;
  b: number;
  c: number;
  /** Smoothed fill opacity multiplier, eased toward 1 as it's discovered. */
  reveal: number;
}

export interface Signal {
  edgeIndex: number;
  /** true: travels a -> b, false: travels b -> a */
  forward: boolean;
  /** 0..1 progress along the edge. */
  t: number;
  /** progress units per second. */
  speed: number;
  /** 0..1 overall brightness of this pulse. */
  strength: number;
  /** how many propagation hops this signal is from the original trigger. */
  generation: number;
}

export interface Pointer {
  x: number;
  y: number;
  active: boolean;
  /** True for touch input, where there's no hover-only ambient probing. */
  isTouch: boolean;
}

export interface NetworkTunables {
  nodeCount: number;
  maxConnectionsPerNode: number;
  maxConnectionDistance: number;
  hubChance: number;

  driftSpeed: number;
  parallaxStrength: number;
  cursorRepelStrength: number;
  cursorRepelRadius: number;

  interactionRadius: number;
  signalSpeed: number;
  signalSpawnProbability: number;
  maxActiveSignals: number;
  propagationChance: number;
  maxPropagationGeneration: number;

  edgeBaseOpacity: number;
  edgeLitOpacity: number;
  nodeBaseOpacity: number;
  polygonOpacity: number;
  glowIntensity: number;

  leftMargin: number; // fraction of width kept sparse for headline text
  leftMarginDensity: number; // density multiplier applied inside that margin

  reducedMotion: boolean;
}
