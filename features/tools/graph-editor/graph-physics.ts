import type { Graph } from './graph-types';

export type PhysicsOptions = {
  edgeLength: number;
  width: number;
  height: number;
};

const DAMPING = 0.82;
const SPRING_K = 0.02;
const GRAVITY_K = 0.004;
const REPULSION_RANGE = 3;
const MAX_STEP = 8;

export function stepPhysics(graph: Graph, options: PhysicsOptions): void {
  const { edgeLength, width, height } = options;
  const repulsion = edgeLength * edgeLength * 0.6;
  const cutoff = edgeLength * REPULSION_RANGE;
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < graph.nodes.length; i++) {
    const a = graph.nodes[i];
    for (let j = i + 1; j < graph.nodes.length; j++) {
      const b = graph.nodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let d2 = dx * dx + dy * dy;
      if (d2 > cutoff * cutoff) continue;
      if (d2 < 1) {
        dx = (i - j) * 0.5 || 0.5;
        dy = 0.5;
        d2 = dx * dx + dy * dy;
      }
      const d = Math.sqrt(d2);
      const force = repulsion / d2;
      const fx = (dx / d) * force;
      const fy = (dy / d) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }
  }

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  for (const edge of graph.edges) {
    const a = nodeById.get(edge.source);
    const b = nodeById.get(edge.target);
    if (!a || !b || a === b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const force = (d - edgeLength) * SPRING_K;
    const fx = (dx / d) * force;
    const fy = (dy / d) * force;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  for (const node of graph.nodes) {
    if (node.fixed) {
      node.vx = 0;
      node.vy = 0;
      continue;
    }
    node.vx += (cx - node.x) * GRAVITY_K;
    node.vy += (cy - node.y) * GRAVITY_K;
    node.vx *= DAMPING;
    node.vy *= DAMPING;
    const speed = Math.hypot(node.vx, node.vy);
    if (speed > MAX_STEP) {
      node.vx = (node.vx / speed) * MAX_STEP;
      node.vy = (node.vy / speed) * MAX_STEP;
    }
    node.x += node.vx;
    node.y += node.vy;
  }
}
