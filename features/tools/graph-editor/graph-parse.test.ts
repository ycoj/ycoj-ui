import {
  isUsableLabel,
  nextNodeLabel,
  nodeMapOf,
  parseGraphText,
  serializeGraph,
} from './graph-parse';
import type { Graph } from './graph-types';
import { describe, expect, it } from 'vitest';

const labels = (graph: Graph) => graph.nodes.map((node) => node.label);

describe('parseGraphText', () => {
  it('parses a count line and edges in 1-indexed mode', () => {
    const parsed = parseGraphText('3\n1 2\n2 3 7', 'one');
    expect(labels(parsed)).toEqual(['1', '2', '3']);
    expect(parsed.declaredCount).toBe(3);
    expect(parsed.edges).toHaveLength(2);
    expect(parsed.edges[1].weight).toBe('7');
    expect(parsed.skipped).toBe(0);
  });

  it('labels nodes from 0 in 0-indexed mode', () => {
    const parsed = parseGraphText('3\n0 1', 'zero');
    expect(labels(parsed)).toEqual(['0', '1', '2']);
  });

  it('auto-creates endpoints not covered by the count', () => {
    const parsed = parseGraphText('2\n1 5', 'one');
    expect(labels(parsed)).toEqual(['1', '2', '5']);
  });

  it('treats a missing count line as zero declared nodes', () => {
    const parsed = parseGraphText('1 2', 'one');
    expect(parsed.declaredCount).toBeNull();
    expect(labels(parsed)).toEqual(['1', '2']);
  });

  it('skips non-integer endpoints in indexed modes', () => {
    const parsed = parseGraphText('2\na b\n1 2', 'one');
    expect(labels(parsed)).toEqual(['1', '2']);
    expect(parsed.edges).toHaveLength(1);
    expect(parsed.skipped).toBe(1);
  });

  it('parses custom labels and isolated nodes', () => {
    const parsed = parseGraphText('a b 3\nb c\nsolo', 'custom');
    expect(labels(parsed)).toEqual(['a', 'b', 'c', 'solo']);
    expect(parsed.edges).toHaveLength(2);
    expect(parsed.edges[0].weight).toBe('3');
    expect(parsed.declaredCount).toBeNull();
  });

  it('preserves positions of previously known labels', () => {
    const first = parseGraphText('2\n1 2', 'one');
    first.nodes[0].x = 111;
    first.nodes[0].fixed = true;
    const second = parseGraphText('3\n1 2\n2 3', 'one', nodeMapOf(first));
    const node1 = second.nodes.find((node) => node.id === '1');
    expect(node1?.x).toBe(111);
    expect(node1?.fixed).toBe(true);
  });
});

describe('serializeGraph', () => {
  it.each(['zero', 'one'] as const)('round-trips in %s mode', (scheme) => {
    const text = scheme === 'zero' ? '4\n0 1\n1 2 5' : '4\n1 2\n2 3 5';
    const parsed = parseGraphText(text, scheme);
    const out = serializeGraph(parsed, scheme);
    expect(out).toBe(text);
  });

  it('preserves sparse labels after deletions in indexed modes', () => {
    const parsed = parseGraphText('4\n1 2\n2 3\n3 4', 'one');
    const remaining: Graph = {
      nodes: parsed.nodes.filter((node) => node.label !== '2'),
      edges: parsed.edges.filter(
        (edge) => edge.source !== '2' && edge.target !== '2'
      ),
    };
    expect(serializeGraph(remaining, 'one')).toBe('0\n1\n3\n4\n3 4');
  });

  it('round-trips sparse label sets exactly', () => {
    const text = '0\n1\n3\n4\n3 4';
    const parsed = parseGraphText(text, 'one');
    expect(labels(parsed)).toEqual(['1', '3', '4']);
    expect(parsed.declaredCount).toBe(0);
    expect(serializeGraph(parsed, 'one')).toBe(text);
  });

  it('treats lone integer lines as isolated nodes in indexed modes', () => {
    const parsed = parseGraphText('1 2\n7', 'one');
    expect(labels(parsed)).toEqual(['1', '2', '7']);
  });

  it('lists isolated nodes as lone labels in custom mode', () => {
    const parsed = parseGraphText('a b 2\nsolo', 'custom');
    expect(serializeGraph(parsed, 'custom')).toBe('a b 2\nsolo');
  });

  it('converts an indexed graph to custom text without losing nodes', () => {
    const parsed = parseGraphText('3\n1 2', 'one');
    const out = serializeGraph(parsed, 'custom');
    expect(out).toBe('1 2\n3');
    const reparsed = parseGraphText(out, 'custom');
    expect(labels(reparsed)).toEqual(['1', '2', '3']);
  });
});

describe('nextNodeLabel', () => {
  it('returns the smallest free index for indexed schemes', () => {
    const parsed = parseGraphText('3\n1 3', 'one');
    const graph: Graph = {
      nodes: parsed.nodes.filter((node) => node.label !== '2'),
      edges: parsed.edges,
    };
    expect(nextNodeLabel(graph, 'one')).toBe('2');
  });

  it('returns a v-prefixed label for custom scheme', () => {
    const graph = parseGraphText('v1 v2', 'custom');
    expect(nextNodeLabel(graph, 'custom')).toBe('v3');
  });
});

describe('isUsableLabel', () => {
  it('accepts a free integer label in indexed modes', () => {
    const graph = parseGraphText('3\n1 2', 'one');
    expect(isUsableLabel(graph, 'one', '9', '2')).toBe(true);
    expect(isUsableLabel(graph, 'one', '3', '2')).toBe(false);
    expect(isUsableLabel(graph, 'one', 'x', '2')).toBe(false);
  });

  it('rejects whitespace and duplicates in custom mode', () => {
    const graph = parseGraphText('a b', 'custom');
    expect(isUsableLabel(graph, 'custom', 'c d', 'a')).toBe(false);
    expect(isUsableLabel(graph, 'custom', 'b', 'a')).toBe(false);
    expect(isUsableLabel(graph, 'custom', 'c', 'a')).toBe(true);
  });
});
