"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  buildGraph,
  buildGrid,
  buildTriangles,
  carryOverEdgeState,
  clamp01,
  generateNodes,
  updateEdgeProximity,
  updateNodes,
  type AdjacencyEntry,
} from "./network";
import { maybeSpawnSignal, signalPosition, updateSignals } from "./signals";
import type { Edge, NetworkTunables, Node, Pointer, Signal, Triangle } from "./types";

interface NetworkCanvasProps {
  width: number;
  height: number;
  containerRef: RefObject<HTMLElement | null>;
  tunables: NetworkTunables;
}

/* ------------------------------------------------------------------ */
/* palette -- pulled directly from the site's real tokens in           */
/* src/app/globals.css (:root). Canvas needs concrete rgb triples      */
/* rather than var() references, so these are the resolved values of:  */
/*   --text   #f0ede8  -> node / dim-ivory color                       */
/*   --accent #C05A5D  -> lit edges + signal glow (primary crimson)    */
/*   --accent2 #A63D40 -> polygon warm tint (secondary crimson)        */
/* Edge "at rest" and the signal's bright core aren't literal tokens   */
/* (the site has no neutral-gray or off-white token), so those two are */
/* hand-picked to sit naturally between --bg and --text / --accent.    */
/* The site is dark-theme only (see root layout: data-theme="dark"),   */
/* so there's no light-mode variant to account for here.               */
/* ------------------------------------------------------------------ */

const EDGE_BASE: readonly [number, number, number] = [150, 148, 144];
const EDGE_LIT: readonly [number, number, number] = [192, 90, 93]; // --accent
const NODE_BASE: readonly [number, number, number] = [240, 237, 232]; // --text
const NODE_HUB: readonly [number, number, number] = [240, 237, 232]; // --text
const SIGNAL_CORE: readonly [number, number, number] = [247, 223, 219];
const SIGNAL_GLOW: readonly [number, number, number] = [192, 90, 93]; // --accent
const POLY_BASE: readonly [number, number, number] = [12, 12, 16]; // --surface
const POLY_WARM: readonly [number, number, number] = [166, 61, 64]; // --accent2

function lerpColor(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number
): [number, number, number] {
  const c = clamp01(t);
  return [a[0] + (b[0] - a[0]) * c, a[1] + (b[1] - a[1]) * c, a[2] + (b[2] - a[2]) * c];
}

const DEPTH_TIERS = 4;
const GRAPH_REBUILD_EVERY_N_FRAMES = 2;
const MAX_DPR = 2;

/**
 * Renders and drives the network entirely outside React's render cycle.
 * Node/edge/signal state lives in refs and is mutated in place inside a
 * single requestAnimationFrame loop; React only re-runs this effect when
 * the canvas needs to be resized or the tunables object identity changes.
 */
export function NetworkCanvas({ width, height, containerRef, tunables }: NetworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const adjacencyRef = useRef<AdjacencyEntry[][]>([]);
  const trianglesRef = useRef<Triangle[]>([]);
  const signalsRef = useRef<Signal[]>([]);

  const pointerRef = useRef<Pointer>({ x: 0, y: 0, active: false, isTouch: false });
  const parallaxRef = useRef({ x: 0, y: 0 });

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastGenSizeRef = useRef({ width: 0, height: 0, nodeCount: 0 });
  const tunablesRef = useRef<NetworkTunables>(tunables);
  tunablesRef.current = tunables;

  /* ---- (re)generate the node field when size / density changes ---- */
  useEffect(() => {
    if (width <= 0 || height <= 0) return;

    const last = lastGenSizeRef.current;
    const nodeCountChanged = last.nodeCount !== tunables.nodeCount;
    const firstRun = last.width === 0 || last.height === 0;

    if (firstRun || nodeCountChanged) {
      nodesRef.current = generateNodes(width, height, tunables);
    } else {
      // Rescale existing positions instead of regenerating -- avoids a
      // visible "reshuffle" flash on ordinary resizes.
      const scaleX = width / last.width;
      const scaleY = height / last.height;
      if (Number.isFinite(scaleX) && Number.isFinite(scaleY)) {
        for (const n of nodesRef.current) {
          n.x *= scaleX;
          n.y *= scaleY;
          n.anchorX *= scaleX;
          n.anchorY *= scaleY;
        }
      }
    }
    lastGenSizeRef.current = { width, height, nodeCount: tunables.nodeCount };

    const grid = buildGrid(nodesRef.current, tunables.maxConnectionDistance);
    const { edges, adjacency } = buildGraph(nodesRef.current, grid, tunables);
    edgesRef.current = edges;
    adjacencyRef.current = adjacency;
    trianglesRef.current = buildTriangles(edges, adjacency);
    signalsRef.current = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, tunables.nodeCount, tunables.maxConnectionDistance, tunables.leftMargin]);

  /* ---- size the canvas backing store ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d");
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [width, height]);

  /* ---- pointer tracking (window-level so it works under overlaid text) --- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const setFromClient = (clientX: number, clientY: number, isTouch: boolean) => {
      const rect = container.getBoundingClientRect();
      pointerRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
        active: true,
        isTouch,
      };
    };

    const handlePointerMove = (e: PointerEvent) => {
      setFromClient(e.clientX, e.clientY, e.pointerType === "touch");
    };
    const deactivate = () => {
      pointerRef.current = { ...pointerRef.current, active: false };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", deactivate, { passive: true });
    window.addEventListener("pointercancel", deactivate, { passive: true });
    document.addEventListener("mouseleave", deactivate);
    window.addEventListener("blur", deactivate);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerMove);
      window.removeEventListener("pointerup", deactivate);
      window.removeEventListener("pointercancel", deactivate);
      document.removeEventListener("mouseleave", deactivate);
      window.removeEventListener("blur", deactivate);
    };
  }, [containerRef]);

  /* ---- the animation loop itself ---- */
  useEffect(() => {
    if (width <= 0 || height <= 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const step = (now: number) => {
      rafRef.current = requestAnimationFrame(step);

      const last = lastTimeRef.current || now;
      let dt = (now - last) / 1000;
      dt = Math.min(dt, 1 / 20); // clamp so a backgrounded-tab resume doesn't jump the sim
      lastTimeRef.current = now;
      elapsedRef.current += dt;

      const t = tunablesRef.current;
      const nodes = nodesRef.current;
      const pointer = pointerRef.current;

      updateNodes(nodes, dt, elapsedRef.current, pointer, t);

      frameCountRef.current++;
      if (frameCountRef.current % GRAPH_REBUILD_EVERY_N_FRAMES === 0) {
        const grid = buildGrid(nodes, t.maxConnectionDistance);
        const { edges, adjacency } = buildGraph(nodes, grid, t);
        carryOverEdgeState(edgesRef.current, edges);
        edgesRef.current = edges;
        adjacencyRef.current = adjacency;
        trianglesRef.current = buildTriangles(edges, adjacency);
      }

      const edges = edgesRef.current;
      updateEdgeProximity(nodes, edges, pointer, dt, t);

      if (!t.reducedMotion) {
        maybeSpawnSignal(nodes, edges, signalsRef.current, pointer, dt, t);
        updateSignals(nodes, edges, adjacencyRef.current, signalsRef.current, dt, t);
      }

      const targetPX = pointer.active ? ((pointer.x - width / 2) / (width / 2 || 1)) * t.parallaxStrength : 0;
      const targetPY = pointer.active ? ((pointer.y - height / 2) / (height / 2 || 1)) * t.parallaxStrength : 0;
      parallaxRef.current.x += (targetPX - parallaxRef.current.x) * Math.min(1, dt * 3.2);
      parallaxRef.current.y += (targetPY - parallaxRef.current.y) * Math.min(1, dt * 3.2);

      draw(ctx, width, height, nodes, edges, trianglesRef.current, signalsRef.current, t, elapsedRef.current, parallaxRef.current);
    };

    const start = () => {
      if (rafRef.current === null) {
        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(step);
      }
    };
    const stop = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const handleVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", handleVisibility);
    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/* drawing                                                             */
/* ------------------------------------------------------------------ */

function draw(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  nodes: Node[],
  edges: Edge[],
  triangles: Triangle[],
  signals: Signal[],
  t: NetworkTunables,
  elapsed: number,
  parallax: { x: number; y: number }
): void {
  ctx.clearRect(0, 0, width, height);

  // --- polygons: near-invisible geometric fill, warms slightly near an active node
  ctx.save();
  for (const tri of triangles) {
    const a = nodes[tri.a]!;
    const b = nodes[tri.b]!;
    const c = nodes[tri.c]!;
    const avgDepth = (a.depth + b.depth + c.depth) / 3;
    const warmth = Math.max(a.activation, b.activation, c.activation);

    const ax = a.x + parallax.x * (1 - a.depth);
    const ay = a.y + parallax.y * (1 - a.depth);
    const bx = b.x + parallax.x * (1 - b.depth);
    const by = b.y + parallax.y * (1 - b.depth);
    const cx = c.x + parallax.x * (1 - c.depth);
    const cy = c.y + parallax.y * (1 - c.depth);

    const alpha = t.polygonOpacity * (0.5 + 0.5 * avgDepth) + warmth * 0.035;
    const color = lerpColor(POLY_BASE, POLY_WARM, warmth);
    ctx.fillStyle = `rgba(${color[0] | 0},${color[1] | 0},${color[2] | 0},${alpha})`;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // --- edges: batch the dormant majority into a handful of stroke() calls,
  //     draw the (few) cursor-lit edges individually with interpolated color.
  const tierPaths: Path2D[] = [];
  for (let i = 0; i < DEPTH_TIERS; i++) tierPaths.push(new Path2D());
  const litEdges: Edge[] = [];

  for (const e of edges) {
    const na = nodes[e.a]!;
    const nb = nodes[e.b]!;
    if (e.proximity >= 0.03) {
      litEdges.push(e);
      continue;
    }
    const avgDepth = (na.depth + nb.depth) / 2;
    const tier = Math.min(DEPTH_TIERS - 1, Math.floor(avgDepth * DEPTH_TIERS));
    const path = tierPaths[tier]!;
    path.moveTo(na.x + parallax.x * (1 - na.depth), na.y + parallax.y * (1 - na.depth));
    path.lineTo(nb.x + parallax.x * (1 - nb.depth), nb.y + parallax.y * (1 - nb.depth));
  }

  for (let tier = 0; tier < DEPTH_TIERS; tier++) {
    const depthFactor = (tier + 0.5) / DEPTH_TIERS;
    const alpha = t.edgeBaseOpacity * (0.4 + 0.6 * depthFactor);
    ctx.strokeStyle = `rgba(${EDGE_BASE[0]},${EDGE_BASE[1]},${EDGE_BASE[2]},${alpha})`;
    ctx.lineWidth = 0.55 + depthFactor * 0.45;
    ctx.stroke(tierPaths[tier]!);
  }

  for (const e of litEdges) {
    const na = nodes[e.a]!;
    const nb = nodes[e.b]!;
    const avgDepth = (na.depth + nb.depth) / 2;
    const baseAlpha = t.edgeBaseOpacity * (0.4 + 0.6 * avgDepth);
    const alpha = Math.min(1, baseAlpha + e.proximity * t.edgeLitOpacity);
    const color = lerpColor(EDGE_BASE, EDGE_LIT, e.proximity);
    ctx.strokeStyle = `rgba(${color[0] | 0},${color[1] | 0},${color[2] | 0},${alpha})`;
    ctx.lineWidth = 0.55 + avgDepth * 0.45 + e.proximity * 1.1;
    ctx.beginPath();
    ctx.moveTo(na.x + parallax.x * (1 - na.depth), na.y + parallax.y * (1 - na.depth));
    ctx.lineTo(nb.x + parallax.x * (1 - nb.depth), nb.y + parallax.y * (1 - nb.depth));
    ctx.stroke();
  }

  // --- signal pulses: additive soft glow + a small bright core, traveling along the edge
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const s of signals) {
    const edge = edges[s.edgeIndex];
    if (!edge) continue;
    const pos = signalPosition(s, edge, nodes);
    const glowR = (10 + 8 * (1 - s.generation * 0.25)) * t.glowIntensity * s.strength;

    const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, Math.max(1, glowR));
    grad.addColorStop(0, `rgba(${SIGNAL_GLOW[0]},${SIGNAL_GLOW[1]},${SIGNAL_GLOW[2]},${0.5 * s.strength})`);
    grad.addColorStop(1, `rgba(${SIGNAL_GLOW[0]},${SIGNAL_GLOW[1]},${SIGNAL_GLOW[2]},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(1, glowR), 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = `rgba(${SIGNAL_CORE[0]},${SIGNAL_CORE[1]},${SIGNAL_CORE[2]},${0.85 * s.strength})`;
    ctx.arc(pos.x, pos.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- nodes: dim ambient dots, hubs a touch larger, brief glow on signal arrival
  for (const n of nodes) {
    const r = n.baseRadius * (0.55 + n.depth * 0.9);
    const twinkle = 1 + 0.1 * Math.sin(elapsed * 0.6 + n.twinkleSeed);
    const baseAlpha = t.nodeBaseOpacity * (0.35 + 0.65 * n.depth) * twinkle;
    const color = n.isHub ? NODE_HUB : NODE_BASE;
    const alpha = Math.min(1, baseAlpha + n.activation * 0.5);
    const rx = n.x + parallax.x * (1 - n.depth);
    const ry = n.y + parallax.y * (1 - n.depth);

    ctx.beginPath();
    ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();

    if (n.activation > 0.04) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const glowR = r * 3 + 8 * n.activation * t.glowIntensity;
      const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, glowR);
      grad.addColorStop(0, `rgba(${SIGNAL_GLOW[0]},${SIGNAL_GLOW[1]},${SIGNAL_GLOW[2]},${0.4 * n.activation})`);
      grad.addColorStop(1, `rgba(${SIGNAL_GLOW[0]},${SIGNAL_GLOW[1]},${SIGNAL_GLOW[2]},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
