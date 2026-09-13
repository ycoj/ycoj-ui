import { edgeMidpoint, edgeShapes, type EdgeShape } from './graph-geometry';
import type { GraphEdge, GraphNode } from './graph-types';
import { describe, expect, it } from 'vitest';

const node: GraphNode = {
  label: 'a',
  x: 0,
  y: 0,
  fixed: false,
  vx: 0,
  vy: 0,
};

const makeNode = (label: string, x: number, y: number): GraphNode => ({
  label,
  x,
  y,
  fixed: false,
  vx: 0,
  vy: 0,
});

describe('edgeMidpoint', () => {
  it('evaluates the quadratic curve at t=0.5 for line edges', () => {
    const shape: EdgeShape = {
      kind: 'line',
      x1: 0,
      y1: 0,
      cx: 10,
      cy: 20,
      x2: 40,
      y2: 0,
    };
    // 0.25·p1 + 0.5·c + 0.25·p2 — off the straight-line midpoint (20, 0).
    expect(edgeMidpoint(shape)).toEqual({ x: 15, y: 10 });
  });

  it('returns the top of the circle for loop edges', () => {
    const shape: EdgeShape = { kind: 'loop', node, cx: 5, cy: 10, r: 4 };
    expect(edgeMidpoint(shape)).toEqual({ x: 5, y: 6 });
  });
});

describe('edgeShapes', () => {
  const lineShapeOf = (
    positioned: ReturnType<typeof edgeShapes>,
    id: string
  ) => {
    const found = positioned.find((item) => item.edge.id === id);
    if (found?.shape.kind !== 'line') throw new Error('expected line shape');
    return found.shape;
  };

  it('does not merge edge groups when labels contain the separator', () => {
    // The old `${a}→${b}` key collided for pairs ('a→b','c') and
    // ('a','b→c'), curving them as if they were parallel edges.
    const nodes = [
      makeNode('a→b', 0, 0),
      makeNode('c', 100, 0),
      makeNode('a', 0, 100),
      makeNode('b→c', 100, 100),
    ];
    const edges: GraphEdge[] = [
      { id: 'e1', source: 'a→b', target: 'c', weight: '' },
      { id: 'e2', source: 'a', target: 'b→c', weight: '' },
    ];
    const positioned = edgeShapes({ nodes, edges }, 18);
    // Each pair is a single-edge group, drawn straight: the control point
    // sits exactly on the node-center midpoint.
    expect(lineShapeOf(positioned, 'e1')).toMatchObject({ cx: 50, cy: 0 });
    expect(lineShapeOf(positioned, 'e2')).toMatchObject({ cx: 50, cy: 100 });
  });

  it('separates anti-parallel edges onto opposite curves', () => {
    const nodes = [makeNode('a', 0, 0), makeNode('b', 100, 0)];
    const edges: GraphEdge[] = [
      { id: 'e1', source: 'a', target: 'b', weight: '' },
      { id: 'e2', source: 'b', target: 'a', weight: '' },
    ];
    const positioned = edgeShapes({ nodes, edges }, 18);
    const first = lineShapeOf(positioned, 'e1');
    const second = lineShapeOf(positioned, 'e2');
    expect(first.cy).toBeCloseTo(-13);
    expect(second.cy).toBeCloseTo(13);
  });

  it('gives multiple loops on one node distinct radii', () => {
    const nodes = [makeNode('a', 0, 0)];
    const edges: GraphEdge[] = [
      { id: 'e1', source: 'a', target: 'a', weight: '' },
      { id: 'e2', source: 'a', target: 'a', weight: '' },
      { id: 'e3', source: 'a', target: 'a', weight: '' },
    ];
    const positioned = edgeShapes({ nodes, edges }, 18);
    const loops = positioned.map((item) => {
      if (item.shape.kind !== 'loop') throw new Error('expected loop');
      return item.shape;
    });
    // Nested circles tangent at the node top: each radius grows by one
    // LOOP_RADIUS_RATIO step so arcs, arrows, and labels stay apart.
    expect(loops[0].r).toBeCloseTo(16.2);
    expect(loops[1].r).toBeCloseTo(32.4);
    expect(loops[2].r).toBeCloseTo(48.6);
    expect(loops[1].cy - loops[0].cy).toBeCloseTo(loops[0].r - loops[1].r);
  });
});
