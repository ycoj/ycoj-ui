import { arrangeAsTree } from './graph-layout';
import { parseGraphText } from './graph-parse';
import { describe, expect, it } from 'vitest';

describe('arrangeAsTree', () => {
  it('lays out a chain in increasing depth order', () => {
    const graph = parseGraphText('4\n1 2\n2 3\n3 4', 'one');
    arrangeAsTree(graph, { width: 600, edgeLength: 100 });
    const byId = new Map(graph.nodes.map((node) => [node.label, node]));
    expect(byId.get('1')!.y).toBeLessThan(byId.get('2')!.y);
    expect(byId.get('2')!.y).toBeLessThan(byId.get('3')!.y);
    expect(byId.get('3')!.y).toBeLessThan(byId.get('4')!.y);
  });

  it('fixes every node so the layout survives the force simulation', () => {
    const graph = parseGraphText('3\n1 2\n2 3', 'one');
    arrangeAsTree(graph, { width: 600, edgeLength: 100 });
    expect(graph.nodes.every((node) => node.fixed)).toBe(true);
  });

  it('handles disconnected components and isolated nodes', () => {
    const graph = parseGraphText('5\n1 2\n3 4', 'one');
    arrangeAsTree(graph, { width: 600, edgeLength: 100 });
    const byId = new Map(graph.nodes.map((node) => [node.label, node]));
    expect(byId.get('5')!.y).toBeGreaterThan(byId.get('3')!.y);
    for (const node of graph.nodes) {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });

  it('terminates on cyclic graphs', () => {
    const graph = parseGraphText('3\n1 2\n2 3\n3 1', 'one');
    arrangeAsTree(graph, { width: 600, edgeLength: 100 });
    const ys = graph.nodes.map((node) => node.y);
    expect(new Set(ys).size).toBe(2);
  });
});
