import {
  edgeMidpoint,
  edgeShapes,
  lineArrowhead,
  loopArrowhead,
  type Arrowhead,
} from './graph-geometry';
import type { Graph, ResolvedColors } from './graph-types';

export type RenderOptions = {
  directed: boolean;
  nodeRadius: number;
  colors: ResolvedColors;
  draft?: { sourceLabel: string; x: number; y: number } | null;
};

export const FONT_FAMILY = 'ui-sans-serif, system-ui, sans-serif';

const fillArrowhead = (ctx: CanvasRenderingContext2D, arrow: Arrowhead) => {
  ctx.beginPath();
  ctx.moveTo(arrow.tip.x, arrow.tip.y);
  ctx.lineTo(arrow.left.x, arrow.left.y);
  ctx.lineTo(arrow.right.x, arrow.right.y);
  ctx.closePath();
  ctx.fill();
};

export function drawGraph(
  ctx: CanvasRenderingContext2D,
  graph: Graph,
  options: RenderOptions
): void {
  const { directed, nodeRadius, colors, draft } = options;
  const fontSize = Math.max(14, nodeRadius * 0.85);

  ctx.lineWidth = 1.6;
  ctx.strokeStyle = colors.edge;
  ctx.fillStyle = colors.edge;

  const shapes = edgeShapes(graph, nodeRadius);
  for (const { shape } of shapes) {
    ctx.beginPath();
    if (shape.kind === 'loop') {
      ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
      ctx.stroke();
      if (directed) {
        fillArrowhead(ctx, loopArrowhead(shape));
      }
    } else {
      ctx.moveTo(shape.x1, shape.y1);
      ctx.quadraticCurveTo(shape.cx, shape.cy, shape.x2, shape.y2);
      ctx.stroke();
      if (directed) {
        fillArrowhead(ctx, lineArrowhead(shape));
      }
    }
  }

  for (const { edge, shape } of shapes) {
    if (!edge.weight) continue;
    const mid = edgeMidpoint(shape);
    const text = edge.weight;
    ctx.font = `${fontSize * 0.85}px ${FONT_FAMILY}`;
    const metrics = ctx.measureText(text);
    const padX = 4;
    const padY = 2;
    const w = metrics.width + padX * 2;
    const h = fontSize * 0.85 + padY * 2;
    ctx.fillStyle = colors.background;
    ctx.fillRect(mid.x - w / 2, mid.y - h / 2, w, h);
    ctx.fillStyle = colors.label;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, mid.x, mid.y);
    ctx.fillStyle = colors.edge;
  }

  if (draft) {
    const source = graph.nodes.find((node) => node.label === draft.sourceLabel);
    if (source) {
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = colors.edge;
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(draft.x, draft.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const node of graph.nodes) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
    ctx.fillStyle = colors.node;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = colors.label;
    ctx.stroke();

    if (node.fixed) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius + 3.5, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.label;
      ctx.globalAlpha = 0.45;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = colors.label;
    ctx.fillText(node.label, node.x, node.y);
  }

  if (draft) {
    const source = graph.nodes.find((node) => node.label === draft.sourceLabel);
    if (source) {
      ctx.beginPath();
      ctx.arc(source.x, source.y, nodeRadius + 3.5, 0, Math.PI * 2);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = colors.edge;
      ctx.stroke();
    }
  }
}
