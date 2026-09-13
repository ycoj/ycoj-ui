import type { Graph, GraphEdge, GraphNode, IndexScheme } from './graph-types';

export type ParsedGraph = Graph & {
  declaredCount: number | null;
  skipped: number;
};

export const MAX_NODE_COUNT = 500;

const INTEGER_RE = /^-?\d+$/;

let edgeSeq = 0;

export const createEdgeId = () => `e${edgeSeq++}`;

const spawnPosition = (
  index: number,
  origin: { x: number; y: number }
): { x: number; y: number } => {
  const angle = index * 2.399963;
  const radius = 24 * Math.sqrt(index + 1);
  return {
    x: origin.x + radius * Math.cos(angle),
    y: origin.y + radius * Math.sin(angle),
  };
};

const makeNode = (
  label: string,
  index: number,
  previous: ReadonlyMap<string, GraphNode> | undefined,
  origin: { x: number; y: number }
): GraphNode => {
  const prev = previous?.get(label);
  if (prev) return { ...prev };
  const { x, y } = spawnPosition(index, origin);
  return { id: label, label, x, y, fixed: false, vx: 0, vy: 0 };
};

export function parseGraphText(
  text: string,
  scheme: IndexScheme,
  previous?: ReadonlyMap<string, GraphNode>,
  origin: { x: number; y: number } = { x: 300, y: 220 }
): ParsedGraph {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  let declaredCount: number | null = null;
  if (scheme !== 'custom' && lines.length > 0 && INTEGER_RE.test(lines[0])) {
    declaredCount = Math.min(
      Math.max(parseInt(lines[0], 10), 0),
      MAX_NODE_COUNT
    );
    lines.shift();
  }

  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  let skipped = 0;

  const ensure = (label: string): GraphNode => {
    const existing = nodeMap.get(label);
    if (existing) return existing;
    const node = makeNode(label, nodeMap.size, previous, origin);
    nodeMap.set(label, node);
    return node;
  };

  if (scheme !== 'custom' && declaredCount !== null) {
    const offset = scheme === 'zero' ? 0 : 1;
    for (let i = 0; i < declaredCount; i++) ensure(String(i + offset));
  }

  for (const line of lines) {
    const tokens = line.split(/\s+/);
    if (tokens.length === 1) {
      if (scheme === 'custom' || INTEGER_RE.test(tokens[0])) {
        ensure(tokens[0]);
      } else {
        skipped += 1;
      }
      continue;
    }
    const [u, v] = tokens;
    if (scheme !== 'custom' && (!INTEGER_RE.test(u) || !INTEGER_RE.test(v))) {
      skipped += 1;
      continue;
    }
    const source = ensure(u);
    const target = ensure(v);
    edges.push({
      id: createEdgeId(),
      source: source.id,
      target: target.id,
      weight: tokens.slice(2).join(' '),
    });
  }

  return { nodes: [...nodeMap.values()], edges, declaredCount, skipped };
}

const numericLabel = (label: string): number | null =>
  INTEGER_RE.test(label) ? Number(label) : null;

export function serializeOrder(graph: Graph): GraphNode[] {
  return [...graph.nodes].sort((a, b) => {
    const na = numericLabel(a.label);
    const nb = numericLabel(b.label);
    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return a.label.localeCompare(b.label);
  });
}

export function serializeGraph(graph: Graph, scheme: IndexScheme): string {
  const lines: string[] = [];

  if (scheme === 'custom') {
    for (const edge of graph.edges) {
      lines.push(
        edge.weight
          ? `${edge.source} ${edge.target} ${edge.weight}`
          : `${edge.source} ${edge.target}`
      );
    }
    const connected = new Set(
      graph.edges.flatMap((edge) => [edge.source, edge.target])
    );
    for (const node of graph.nodes) {
      if (!connected.has(node.id)) lines.push(node.label);
    }
    return lines.join('\n');
  }

  const allInteger = graph.nodes.every(
    (node) => numericLabel(node.label) !== null
  );

  if (allInteger) {
    const offset = scheme === 'zero' ? 0 : 1;
    const sortedValues = graph.nodes
      .map((node) => Number(node.label))
      .sort((a, b) => a - b);
    const dense =
      sortedValues.length === 0 ||
      (sortedValues[0] === offset &&
        sortedValues[sortedValues.length - 1] ===
          offset + sortedValues.length - 1);
    if (dense) {
      lines.push(String(sortedValues.length));
    } else {
      lines.push('0');
      for (const node of graph.nodes) lines.push(node.label);
    }
    for (const edge of graph.edges) {
      lines.push(
        edge.weight
          ? `${edge.source} ${edge.target} ${edge.weight}`
          : `${edge.source} ${edge.target}`
      );
    }
    return lines.join('\n');
  }

  const sorted = serializeOrder(graph);
  const indexOf = new Map(sorted.map((node, index) => [node.id, index]));

  lines.push(String(sorted.length));
  for (const edge of graph.edges) {
    const u = indexOf.get(edge.source);
    const v = indexOf.get(edge.target);
    if (u === undefined || v === undefined) continue;
    const su = String(u + (scheme === 'zero' ? 0 : 1));
    const sv = String(v + (scheme === 'zero' ? 0 : 1));
    lines.push(edge.weight ? `${su} ${sv} ${edge.weight}` : `${su} ${sv}`);
  }
  return lines.join('\n');
}

export const isIntegerLabel = (label: string): boolean =>
  INTEGER_RE.test(label);

export function isUsableLabel(
  graph: Graph,
  scheme: IndexScheme,
  value: string,
  excludeId?: string
): boolean {
  if (value.length === 0) return false;
  if (scheme === 'custom') {
    if (/\s/.test(value)) return false;
  } else if (!isIntegerLabel(value)) {
    return false;
  }
  return !graph.nodes.some(
    (node) => node.id === value && node.id !== excludeId
  );
}

export function nodeMapOf(graph: Graph): Map<string, GraphNode> {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

export function nextNodeLabel(graph: Graph, scheme: IndexScheme): string {
  const used = new Set(graph.nodes.map((node) => node.label));
  if (scheme === 'custom') {
    for (let i = 1; ; i++) {
      const label = `v${i}`;
      if (!used.has(label)) return label;
    }
  }
  const start = scheme === 'zero' ? 0 : 1;
  for (let i = start; ; i++) {
    const label = String(i);
    if (!used.has(label)) return label;
  }
}
