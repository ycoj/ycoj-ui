import {
  isUsableLabel,
  MAX_EDGE_COUNT,
  MAX_NODE_COUNT,
  nextNodeLabel,
  nodeMapOf,
  parseGraphText,
  renumberGraph,
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

  it('caps implicitly created nodes at MAX_NODE_COUNT', () => {
    // Each edge introduces two fresh labels, so only the first 250 lines
    // fit under the cap; the rest are skipped without dangling edges.
    const lines = Array.from({ length: 300 }, (_, i) => `a${i} b${i}`);
    const parsed = parseGraphText(lines.join('\n'), 'custom');
    expect(parsed.nodes).toHaveLength(MAX_NODE_COUNT);
    expect(parsed.edges).toHaveLength(MAX_NODE_COUNT / 2);
    expect(parsed.skipped).toBe(50);
  });

  it('rejects lone label lines beyond the node cap', () => {
    const lines = Array.from({ length: MAX_NODE_COUNT + 5 }, (_, i) => `n${i}`);
    const parsed = parseGraphText(lines.join('\n'), 'custom');
    expect(parsed.nodes).toHaveLength(MAX_NODE_COUNT);
    expect(parsed.skipped).toBe(5);
  });

  it('skips edges whose endpoints exceed the cap', () => {
    const parsed = parseGraphText(`${MAX_NODE_COUNT}\n1 9999`, 'one');
    expect(parsed.nodes).toHaveLength(MAX_NODE_COUNT);
    expect(parsed.edges).toHaveLength(0);
    expect(parsed.skipped).toBe(1);
  });

  it('does not strand a node when the second endpoint hits the cap', () => {
    const lines = Array.from({ length: MAX_NODE_COUNT - 1 }, (_, i) => `n${i}`);
    lines.push('u v');
    const parsed = parseGraphText(lines.join('\n'), 'custom');
    expect(parsed.nodes).toHaveLength(MAX_NODE_COUNT - 1);
    expect(labels(parsed)).not.toContain('u');
    expect(parsed.edges).toHaveLength(0);
    expect(parsed.skipped).toBe(1);
  });

  it('caps parsed edges at MAX_EDGE_COUNT', () => {
    const lines = Array.from({ length: MAX_EDGE_COUNT + 3 }, () => 'a b');
    const parsed = parseGraphText(lines.join('\n'), 'custom');
    expect(parsed.edges).toHaveLength(MAX_EDGE_COUNT);
    expect(parsed.skipped).toBe(3);
  });

  it('preserves positions of previously known labels', () => {
    const first = parseGraphText('2\n1 2', 'one');
    first.nodes[0].x = 111;
    first.nodes[0].fixed = true;
    const second = parseGraphText('3\n1 2\n2 3', 'one', nodeMapOf(first));
    const node1 = second.nodes.find((node) => node.label === '1');
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

describe('renumberGraph', () => {
  it('maps custom labels to a dense 1-indexed range in serialize order', () => {
    const graph = parseGraphText('b a\na c 9', 'custom');
    const renumbered = renumberGraph(graph, 1);
    expect(labels(renumbered)).toEqual(['2', '1', '3']);
    expect(
      renumbered.edges.map((edge) => `${edge.source} ${edge.target}`)
    ).toEqual(['2 1', '1 3']);
    const text = serializeGraph(renumbered, 'one');
    expect(text).toBe('3\n2 1\n1 3 9');
    expect(labels(parseGraphText(text, 'one'))).toEqual(['1', '2', '3']);
  });

  it('shifts 1-indexed labels down to 0-indexed', () => {
    const graph = parseGraphText('3\n1 2\n2 3', 'one');
    const renumbered = renumberGraph(graph, 0);
    expect(labels(renumbered)).toEqual(['0', '1', '2']);
    expect(serializeGraph(renumbered, 'zero')).toBe('3\n0 1\n1 2');
  });

  it('shifts 0-indexed labels up to 1-indexed', () => {
    const graph = parseGraphText('3\n0 1\n1 2', 'zero');
    const renumbered = renumberGraph(graph, 1);
    expect(labels(renumbered)).toEqual(['1', '2', '3']);
    expect(serializeGraph(renumbered, 'one')).toBe('3\n1 2\n2 3');
  });

  it('densifies sparse integer labels', () => {
    const graph = parseGraphText('0\n1\n3\n4\n3 4', 'one');
    const renumbered = renumberGraph(graph, 0);
    expect(labels(renumbered)).toEqual(['0', '1', '2']);
    expect(
      renumbered.edges.map((edge) => `${edge.source} ${edge.target}`)
    ).toEqual(['1 2']);
  });

  it('preserves positions, velocities, and fixed flags', () => {
    const graph = parseGraphText('2\n1 2', 'one');
    graph.nodes[0].x = 42;
    graph.nodes[0].y = -7;
    graph.nodes[0].vx = 1.5;
    graph.nodes[0].fixed = true;
    const renumbered = renumberGraph(graph, 0);
    expect(renumbered.nodes[0]).toMatchObject({
      label: '0',
      x: 42,
      y: -7,
      vx: 1.5,
      fixed: true,
    });
    expect(renumbered.nodes[0]).not.toBe(graph.nodes[0]);
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
