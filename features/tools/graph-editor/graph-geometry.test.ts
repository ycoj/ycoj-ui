import { edgeMidpoint, type EdgeShape } from './graph-geometry';
import type { GraphNode } from './graph-types';
import { describe, expect, it } from 'vitest';

const node: GraphNode = {
  label: 'a',
  x: 0,
  y: 0,
  fixed: false,
  vx: 0,
  vy: 0,
};

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
