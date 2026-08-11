import type { AdjacencyEntry } from "./network";
import type { Edge, NetworkTunables, Node, Pointer, Signal } from "./types";

/**
 * Scans lit edges and probabilistically fires a new signal along one of
 * them. Direction is chosen by whichever endpoint the cursor is closer to,
 * so the pulse reads as "the probe excited this end, and it travels
 * outward" rather than a random direction.
 */
export function maybeSpawnSignal(
  nodes: Node[],
  edges: Edge[],
  signals: Signal[],
  pointer: Pointer,
  dt: number,
  tunables: Pick<NetworkTunables, "signalSpawnProbability" | "maxActiveSignals" | "signalSpeed">
): void {
  if (!pointer.active || signals.length >= tunables.maxActiveSignals) return;

  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]!;
    if (e.cooldown > 0 || e.proximity < 0.8) continue;

    const p = tunables.signalSpawnProbability * dt * e.proximity;
    if (Math.random() >= p) continue;

    const na = nodes[e.a]!;
    const nb = nodes[e.b]!;
    const daX = na.x - pointer.x;
    const daY = na.y - pointer.y;
    const dbX = nb.x - pointer.x;
    const dbY = nb.y - pointer.y;
    const forward = daX * daX + daY * daY <= dbX * dbX + dbY * dbY; // start nearer to cursor

    signals.push({ edgeIndex: i, forward, t: 0, speed: tunables.signalSpeed, strength: 1, generation: 0 });
    e.cooldown = 0.85;

    if (signals.length >= tunables.maxActiveSignals) return;
  }
}

export function updateSignals(
  nodes: Node[],
  edges: Edge[],
  adjacency: AdjacencyEntry[][],
  signals: Signal[],
  dt: number,
  tunables: Pick<NetworkTunables, "maxPropagationGeneration" | "propagationChance" | "maxActiveSignals">
): void {
  for (let i = signals.length - 1; i >= 0; i--) {
    const s = signals[i]!;
    s.t += s.speed * dt;
    if (s.t < 1) continue;

    // Arrived: glow the destination node, then maybe propagate outward.
    const edge = edges[s.edgeIndex]!;
    const arrivalId = s.forward ? edge.b : edge.a;
    const cameFromId = s.forward ? edge.a : edge.b;
    const arrivalNode = nodes[arrivalId]!;
    arrivalNode.activation = Math.min(1, arrivalNode.activation + 0.85 * s.strength);

    if (s.generation < tunables.maxPropagationGeneration) {
      const neighbors = adjacency[arrivalId]!;
      for (const nb of neighbors) {
        if (nb.node === cameFromId) continue; // don't bounce straight back
        if (signals.length >= tunables.maxActiveSignals) break;
        if (Math.random() > tunables.propagationChance) continue;

        const nextEdge = edges[nb.edgeIndex]!;
        const forward = nextEdge.a === arrivalId;
        signals.push({
          edgeIndex: nb.edgeIndex,
          forward,
          t: 0,
          speed: s.speed * 0.95,
          strength: s.strength * 0.7,
          generation: s.generation + 1,
        });
        nextEdge.cooldown = Math.max(nextEdge.cooldown, 0.4);
      }
    }

    signals.splice(i, 1);
  }
}

/** World-space position of a signal along its edge, for drawing. */
export function signalPosition(
  signal: Signal,
  edge: Edge,
  nodes: Node[]
): { x: number; y: number } {
  const from = signal.forward ? nodes[edge.a]! : nodes[edge.b]!;
  const to = signal.forward ? nodes[edge.b]! : nodes[edge.a]!;
  return { x: from.x + (to.x - from.x) * signal.t, y: from.y + (to.y - from.y) * signal.t };
}
