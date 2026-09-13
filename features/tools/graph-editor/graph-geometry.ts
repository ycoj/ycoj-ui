import type { Graph, GraphEdge, GraphNode } from './graph-types';

export type EdgeShape =
  | {
      kind: 'line';
      x1: number;
      y1: number;
      cx: number;
      cy: number;
      x2: number;
      y2: number;
    }
  | { kind: 'loop'; node: GraphNode; cx: number; cy: number; r: number };

export type PositionedEdge = { edge: GraphEdge; shape: EdgeShape };

export type Arrowhead = {
  tip: { x: number; y: number };
  left: { x: number; y: number };
  right: { x: number; y: number };
};

const pairKey = (a: string, b: string) => (a < b ? `${a}→${b}` : `${b}→${a}`);

const CURVE_STEP = 26;
const LOOP_RADIUS_RATIO = 0.9;

export function edgeShapes(graph: Graph, nodeRadius: number): PositionedEdge[] {
  const nodes = new Map(graph.nodes.map((node) => [node.label, node]));
  const groups = new Map<string, GraphEdge[]>();
  for (const edge of graph.edges) {
    const key = pairKey(edge.source, edge.target);
    const group = groups.get(key) ?? [];
    group.push(edge);
    groups.set(key, group);
  }

  const shapes: PositionedEdge[] = [];
  for (const edge of graph.edges) {
    const source = nodes.get(edge.source);
    const target = nodes.get(edge.target);
    if (!source || !target) continue;

    if (source.label === target.label) {
      shapes.push({
        edge,
        shape: {
          kind: 'loop',
          node: source,
          cx: source.x,
          cy: source.y - nodeRadius * (1 + LOOP_RADIUS_RATIO),
          r: nodeRadius * LOOP_RADIUS_RATIO,
        },
      });
      continue;
    }

    const group = groups.get(pairKey(edge.source, edge.target)) ?? [edge];
    const index = group.indexOf(edge);
    const offset = (index - (group.length - 1) / 2) * CURVE_STEP;

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = -dy / dist;
    const ny = dx / dist;
    const mx = (source.x + target.x) / 2 + nx * offset;
    const my = (source.y + target.y) / 2 + ny * offset;

    const trim = (px: number, py: number, qx: number, qy: number) => {
      const ddx = qx - px;
      const ddy = qy - py;
      const d = Math.hypot(ddx, ddy) || 1;
      const t = nodeRadius / d;
      return { x: px + ddx * t, y: py + ddy * t };
    };
    const p1 = trim(source.x, source.y, mx, my);
    const p2 = trim(target.x, target.y, mx, my);

    shapes.push({
      edge,
      shape: {
        kind: 'line',
        x1: p1.x,
        y1: p1.y,
        cx: mx,
        cy: my,
        x2: p2.x,
        y2: p2.y,
      },
    });
  }
  return shapes;
}

const pointToSegment = (
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t =
    len2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};

const quadPoint = (
  shape: Extract<EdgeShape, { kind: 'line' }>,
  t: number
): { x: number; y: number } => {
  const mt = 1 - t;
  return {
    x: mt * mt * shape.x1 + 2 * mt * t * shape.cx + t * t * shape.x2,
    y: mt * mt * shape.y1 + 2 * mt * t * shape.cy + t * t * shape.y2,
  };
};

const pointToQuadratic = (
  px: number,
  py: number,
  shape: Extract<EdgeShape, { kind: 'line' }>
): number => {
  const steps = 12;
  let min = Infinity;
  let prevX = shape.x1;
  let prevY = shape.y1;
  for (let i = 1; i <= steps; i++) {
    const point = quadPoint(shape, i / steps);
    min = Math.min(min, pointToSegment(px, py, prevX, prevY, point.x, point.y));
    prevX = point.x;
    prevY = point.y;
  }
  return min;
};

const ARROW_SIZE = 9;
const ARROW_SPREAD = Math.PI * 0.82;
const LOOP_ARROW_RATIO = 0.72;
const LOOP_ARROW_ANGLE = Math.PI * 0.55;

const arrowheadAt = (x: number, y: number, angle: number): Arrowhead => {
  const a1 = angle + ARROW_SPREAD;
  const a2 = angle - ARROW_SPREAD;
  return {
    tip: { x, y },
    left: {
      x: x + ARROW_SIZE * Math.cos(a1),
      y: y + ARROW_SIZE * Math.sin(a1),
    },
    right: {
      x: x + ARROW_SIZE * Math.cos(a2),
      y: y + ARROW_SIZE * Math.sin(a2),
    },
  };
};

// Arrowhead placed at a fixed angle on a self-loop's circle.
export function loopArrowhead(
  shape: Extract<EdgeShape, { kind: 'loop' }>
): Arrowhead {
  return arrowheadAt(
    shape.cx + shape.r * LOOP_ARROW_RATIO,
    shape.cy + shape.r * LOOP_ARROW_RATIO,
    LOOP_ARROW_ANGLE
  );
}

// Arrowhead at the trimmed end of a line edge, following the curve tangent.
export function lineArrowhead(
  shape: Extract<EdgeShape, { kind: 'line' }>
): Arrowhead {
  const dx = shape.x2 - shape.cx;
  const dy = shape.y2 - shape.cy;
  const angle =
    Math.hypot(dx, dy) < 0.001
      ? Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1)
      : Math.atan2(dy, dx);
  return arrowheadAt(shape.x2, shape.y2, angle);
}

export function edgeMidpoint(shape: EdgeShape): { x: number; y: number } {
  if (shape.kind === 'loop') {
    return { x: shape.cx, y: shape.cy - shape.r };
  }
  return quadPoint(shape, 0.5);
}

export function nodeAt(
  graph: Graph,
  x: number,
  y: number,
  nodeRadius: number
): GraphNode | null {
  for (let i = graph.nodes.length - 1; i >= 0; i--) {
    const node = graph.nodes[i];
    if (Math.hypot(node.x - x, node.y - y) <= nodeRadius) return node;
  }
  return null;
}

export function edgeAt(
  graph: Graph,
  x: number,
  y: number,
  nodeRadius: number,
  threshold = 6
): PositionedEdge | null {
  const positioned = edgeShapes(graph, nodeRadius);
  for (let i = positioned.length - 1; i >= 0; i--) {
    const positionedEdge = positioned[i];
    const { shape } = positionedEdge;
    if (shape.kind === 'loop') {
      const d = Math.abs(Math.hypot(x - shape.cx, y - shape.cy) - shape.r);
      if (d <= threshold) return positionedEdge;
    } else if (pointToQuadratic(x, y, shape) <= threshold) {
      return positionedEdge;
    }
  }
  return null;
}
