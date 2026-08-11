import type { Edge, Node, NetworkTunables, Pointer, Triangle } from "./types";

/* ------------------------------------------------------------------ */
/* small math helpers                                                  */
/* ------------------------------------------------------------------ */

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Point-to-segment distance in plain px. */
function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLen2 = abx * abx + aby * aby || 1e-6;
  let t = (apx * abx + apy * aby) / abLen2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

/* ------------------------------------------------------------------ */
/* node generation                                                     */
/* ------------------------------------------------------------------ */

let idCounter = 0;

/**
 * Samples an x position that is deliberately sparser inside the left
 * "headline zone" of the viewport (see BACKGROUND COMPOSITION in the brief).
 * Uses rejection sampling instead of a hard cutoff so the transition from
 * sparse to normal density is soft rather than a visible seam.
 */
function sampleX(width: number, leftMarginFrac: number, leftDensity: number): number {
  const boundary = width * leftMarginFrac;
  for (let attempt = 0; attempt < 6; attempt++) {
    const x = Math.random() * width;
    if (x >= boundary || Math.random() < leftDensity) return x;
  }
  return Math.random() * width * (1 - leftMarginFrac) + boundary;
}

export function generateNodes(
  width: number,
  height: number,
  tunables: Pick<NetworkTunables, "nodeCount" | "hubChance" | "leftMargin" | "leftMarginDensity">
): Node[] {
  const nodes: Node[] = [];
  for (let i = 0; i < tunables.nodeCount; i++) {
    const x = sampleX(width, tunables.leftMargin, tunables.leftMarginDensity);
    const y = Math.random() * height;
    // Bias toward "far" depths so the field reads as vast, with fewer close nodes.
    const depth = Math.pow(Math.random(), 1.35);
    const isHub = Math.random() < tunables.hubChance;

    const freqBase = 0.05 + Math.random() * 0.05; // slow, per-node base frequency
    nodes.push({
      id: idCounter++,
      x,
      y,
      anchorX: x,
      anchorY: y,
      depth,
      isHub,
      baseRadius: isHub ? 2.4 + Math.random() * 1.2 : 0.9 + Math.random() * 1.3,
      driftSeed: {
        freqX1: freqBase,
        freqX2: freqBase * 1.618,
        freqY1: freqBase * 0.87,
        freqY2: freqBase * 1.41,
        phaseX1: Math.random() * Math.PI * 2,
        phaseX2: Math.random() * Math.PI * 2,
        phaseY1: Math.random() * Math.PI * 2,
        phaseY2: Math.random() * Math.PI * 2,
        ampX: 16 + Math.random() * 26,
        ampY: 12 + Math.random() * 22,
      },
      activation: 0,
      twinkleSeed: Math.random() * 1000,
    });
  }
  return nodes;
}

/* ------------------------------------------------------------------ */
/* per-frame node motion                                               */
/* ------------------------------------------------------------------ */

export function updateNodes(
  nodes: Node[],
  dt: number,
  elapsed: number,
  pointer: Pointer,
  tunables: Pick<NetworkTunables, "driftSpeed" | "cursorRepelStrength" | "cursorRepelRadius" | "reducedMotion">
): void {
  const t = elapsed * tunables.driftSpeed;
  const repelOn = pointer.active && !pointer.isTouch && tunables.cursorRepelStrength > 0;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;

    if (node.activation > 0) {
      node.activation = Math.max(0, node.activation - dt * 1.5);
    }

    if (tunables.reducedMotion) {
      // Keep nodes at their anchor: no ambient drift, no repulsion.
      node.x = node.anchorX;
      node.y = node.anchorY;
      continue;
    }

    const s = node.driftSeed;
    const dx =
      s.ampX * (0.65 * Math.sin(t * s.freqX1 + s.phaseX1) + 0.35 * Math.sin(t * s.freqX2 + s.phaseX2));
    const dy =
      s.ampY * (0.65 * Math.sin(t * s.freqY1 + s.phaseY1) + 0.35 * Math.sin(t * s.freqY2 + s.phaseY2));

    let targetX = node.anchorX + dx;
    let targetY = node.anchorY + dy;

    if (repelOn) {
      const ddx = targetX - pointer.x;
      const ddy = targetY - pointer.y;
      const r = tunables.cursorRepelRadius;
      const d2 = ddx * ddx + ddy * ddy;
      if (d2 < r * r && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        const falloff = 1 - d / r;
        const push = falloff * falloff * tunables.cursorRepelStrength;
        targetX += (ddx / d) * push;
        targetY += (ddy / d) * push;
      }
    }

    // Ease toward the target rather than teleporting to it -- this is what
    // keeps the repulsion from reading as "dragging" a particle system.
    const ease = Math.min(1, dt * 2.2);
    node.x += (targetX - node.x) * ease;
    node.y += (targetY - node.y) * ease;
  }
}

/* ------------------------------------------------------------------ */
/* spatial hash grid (neighbor queries without O(n^2) every frame)     */
/* ------------------------------------------------------------------ */

class SpatialGrid {
  private cellSize: number;
  private buckets: Map<string, number[]> = new Map();

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private key(cx: number, cy: number): string {
    return cx + "_" + cy;
  }

  insert(index: number, x: number, y: number): void {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const k = this.key(cx, cy);
    let bucket = this.buckets.get(k);
    if (!bucket) {
      bucket = [];
      this.buckets.set(k, bucket);
    }
    bucket.push(index);
  }

  /** Invokes `cb` for every node index within `radius` of (x, y). */
  queryRadius(
    x: number,
    y: number,
    radius: number,
    nodes: Node[],
    cb: (index: number, dist: number) => void
  ): void {
    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const bucket = this.buckets.get(this.key(cx, cy));
        if (!bucket) continue;
        for (const idx of bucket) {
          const n = nodes[idx]!;
          const dx = n.x - x;
          const dy = n.y - y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d <= radius) cb(idx, d);
        }
      }
    }
  }
}

export function buildGrid(nodes: Node[], cellSize: number): SpatialGrid {
  const grid = new SpatialGrid(cellSize);
  for (let i = 0; i < nodes.length; i++) grid.insert(i, nodes[i]!.x, nodes[i]!.y);
  return grid;
}

/* ------------------------------------------------------------------ */
/* edges + adjacency (k-nearest-neighbor, capped degree)               */
/* ------------------------------------------------------------------ */

export interface AdjacencyEntry {
  node: number;
  edgeIndex: number;
}

export interface GraphBuildResult {
  edges: Edge[];
  adjacency: AdjacencyEntry[][];
}

export function buildGraph(
  nodes: Node[],
  grid: SpatialGrid,
  tunables: Pick<NetworkTunables, "maxConnectionDistance" | "maxConnectionsPerNode">
): GraphBuildResult {
  const n = nodes.length;
  const adjacency: AdjacencyEntry[][] = new Array(n);
  for (let i = 0; i < n; i++) adjacency[i] = [];

  const edges: Edge[] = [];
  const edgeKeys = new Set<string>();
  const candidates: { idx: number; d: number }[] = [];

  for (let i = 0; i < n; i++) {
    candidates.length = 0;
    const node = nodes[i]!;
    const maxPerNode = node.isHub ? tunables.maxConnectionsPerNode + 2 : tunables.maxConnectionsPerNode;

    grid.queryRadius(node.x, node.y, tunables.maxConnectionDistance, nodes, (idx, d) => {
      if (idx === i) return;
      candidates.push({ idx, d });
    });

    candidates.sort((a, b) => a.d - b.d);
    const k = Math.min(maxPerNode, candidates.length);

    for (let c = 0; c < k; c++) {
      const cand = candidates[c]!;
      const j = cand.idx;
      const key = i < j ? i + "_" + j : j + "_" + i;
      if (edgeKeys.has(key)) continue;
      edgeKeys.add(key);

      const edgeIndex = edges.length;
      edges.push({ a: i, b: j, dist: cand.d, proximity: 0, proximityTarget: 0, cooldown: 0 });
      adjacency[i]!.push({ node: j, edgeIndex });
      adjacency[j]!.push({ node: i, edgeIndex });
    }
  }

  return { edges, adjacency };
}

/**
 * Preserves live proximity/cooldown state across a graph rebuild by
 * matching edges on their (a, b) endpoint pair. Without this, edges would
 * "forget" they were lit every time the graph is rebuilt and the glow
 * would stutter.
 */
export function carryOverEdgeState(prevEdges: Edge[], nextEdges: Edge[]): void {
  if (prevEdges.length === 0) return;
  const prevByKey = new Map<string, Edge>();
  for (const e of prevEdges) {
    const key = e.a < e.b ? e.a + "_" + e.b : e.b + "_" + e.a;
    prevByKey.set(key, e);
  }
  for (const e of nextEdges) {
    const key = e.a < e.b ? e.a + "_" + e.b : e.b + "_" + e.a;
    const prev = prevByKey.get(key);
    if (prev) {
      e.proximity = prev.proximity;
      e.cooldown = prev.cooldown;
    }
  }
}

/* ------------------------------------------------------------------ */
/* triangles (for the faint polygon fills)                             */
/* ------------------------------------------------------------------ */

export function buildTriangles(edges: Edge[], adjacency: AdjacencyEntry[][]): Triangle[] {
  const triangles: Triangle[] = [];
  const seen = new Set<string>();

  for (const e of edges) {
    const neighborsA = adjacency[e.a]!;
    const neighborsB = adjacency[e.b]!;
    for (const na of neighborsA) {
      if (na.node === e.b) continue;
      for (const nb of neighborsB) {
        if (nb.node === na.node) {
          const ids = [e.a, e.b, na.node].sort((x, y) => x - y);
          const key = ids.join("_");
          if (!seen.has(key)) {
            seen.add(key);
            triangles.push({ a: ids[0]!, b: ids[1]!, c: ids[2]!, reveal: 0 });
          }
          break;
        }
      }
    }
  }

  return triangles;
}

/* ------------------------------------------------------------------ */
/* cursor -> edge proximity                                            */
/* ------------------------------------------------------------------ */

export function updateEdgeProximity(
  nodes: Node[],
  edges: Edge[],
  pointer: Pointer,
  dt: number,
  tunables: Pick<NetworkTunables, "interactionRadius">
): void {
  const radius = tunables.interactionRadius;

  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]!;

    if (pointer.active) {
      const na = nodes[e.a]!;
      const nb = nodes[e.b]!;
      const d = distToSegment(pointer.x, pointer.y, na.x, na.y, nb.x, nb.y);
      e.proximityTarget = d > radius ? 0 : Math.pow(1 - d / radius, 1.6);
    } else {
      e.proximityTarget = 0;
    }

    // Ignite quickly, fade slowly -- "gradually fades back to normal state".
    const rate = e.proximityTarget > e.proximity ? dt * 8 : dt * 2.5;
    e.proximity += (e.proximityTarget - e.proximity) * Math.min(1, rate);
    if (e.proximity < 0.001) e.proximity = 0;

    if (e.cooldown > 0) e.cooldown = Math.max(0, e.cooldown - dt);
  }
}
