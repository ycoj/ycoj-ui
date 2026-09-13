export type IndexScheme = 'zero' | 'one' | 'custom';

export type EditorMode = 'force' | 'draw' | 'edit' | 'delete';

export type GraphNode = {
  label: string;
  x: number;
  y: number;
  fixed: boolean;
  vx: number;
  vy: number;
};

export type GraphEdge = {
  id: string;
  // source and target hold node labels; labels are unique within a graph
  source: string;
  target: string;
  weight: string;
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type ColorOverrides = {
  node: string | null;
  label: string | null;
  edge: string | null;
};

export type GraphStyle = {
  nodeRadius: number;
  edgeLength: number;
  colors: ColorOverrides;
};

export type ResolvedColors = {
  node: string;
  label: string;
  edge: string;
  background: string;
};
