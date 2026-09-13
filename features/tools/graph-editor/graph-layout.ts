import type { Graph, GraphNode } from './graph-types';

export type TreeLayoutOptions = {
  width: number;
  edgeLength: number;
  horizontalSpacing?: number;
  verticalSpacing?: number;
};

type TreeComponent = {
  placed: { node: GraphNode; depth: number; order: number }[];
  width: number;
  depth: number;
};

const buildComponent = (
  root: GraphNode,
  adjacency: Map<string, GraphNode[]>,
  nodeById: Map<string, GraphNode>
): TreeComponent => {
  const depth = new Map<string, number>([[root.id, 0]]);
  const children = new Map<string, GraphNode[]>();
  const queue = [root];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of adjacency.get(current.id) ?? []) {
      if (depth.has(next.id)) continue;
      depth.set(next.id, (depth.get(current.id) ?? 0) + 1);
      const siblings = children.get(current.id) ?? [];
      siblings.push(next);
      children.set(current.id, siblings);
      queue.push(next);
    }
  }

  const order = new Map<string, number>();
  let cursor = 0;
  const assign = (node: GraphNode): number => {
    const kids = children.get(node.id) ?? [];
    if (kids.length === 0) {
      order.set(node.id, cursor++);
      return order.get(node.id)!;
    }
    const positions = kids.map(assign);
    const mid = (positions[0] + positions[positions.length - 1]) / 2;
    order.set(node.id, mid);
    return mid;
  };
  assign(root);

  const placed = [...depth.keys()].map((id) => ({
    node: nodeById.get(id)!,
    depth: depth.get(id)!,
    order: order.get(id)!,
  }));

  return {
    placed,
    width: Math.max(cursor - 1, 0),
    depth: Math.max(...depth.values(), 0),
  };
};

export function arrangeAsTree(graph: Graph, options: TreeLayoutOptions): void {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, GraphNode[]>();
  for (const edge of graph.edges) {
    const a = nodeById.get(edge.source);
    const b = nodeById.get(edge.target);
    if (!a || !b || a === b) continue;
    const aList = adjacency.get(a.id) ?? [];
    if (aList.length === 0) adjacency.set(a.id, aList);
    aList.push(b);
    const bList = adjacency.get(b.id) ?? [];
    if (bList.length === 0) adjacency.set(b.id, bList);
    bList.push(a);
  }

  const hSpace = options.horizontalSpacing ?? options.edgeLength * 0.9;
  const vSpace = options.verticalSpacing ?? options.edgeLength * 1.1;

  const visited = new Set<string>();
  const components: TreeComponent[] = [];
  for (const node of graph.nodes) {
    if (visited.has(node.id)) continue;
    const component = buildComponent(node, adjacency, nodeById);
    for (const item of component.placed) visited.add(item.node.id);
    components.push(component);
  }

  let yCursor = vSpace;
  for (const component of components) {
    const width = component.width * hSpace;
    const xOffset = Math.max((options.width - width) / 2, hSpace);
    for (const { node, depth, order } of component.placed) {
      node.x = xOffset + order * hSpace;
      node.y = yCursor + depth * vSpace;
      node.vx = 0;
      node.vy = 0;
      node.fixed = true;
    }
    yCursor += (component.depth + 1) * vSpace + vSpace * 0.5;
  }
}
