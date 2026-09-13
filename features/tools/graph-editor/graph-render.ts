import { edgeMidpoint, edgeShapes, type EdgeShape } from './graph-geometry';
import type { Graph, ResolvedColors } from './graph-types';

export type RenderOptions = {
  directed: boolean;
  nodeRadius: number;
  colors: ResolvedColors;
  draft?: { sourceId: string; x: number; y: number } | null;
};

const ARROW_SIZE = 9;
const FONT_FAMILY = 'ui-sans-serif, system-ui, sans-serif';

const lineEndAngle = (shape: Extract<EdgeShape, { kind: 'line' }>): number => {
  const dx = shape.x2 - shape.cx;
  const dy = shape.y2 - shape.cy;
  if (Math.hypot(dx, dy) < 0.001) {
    return Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
  }
  return Math.atan2(dy, dx);
};

const drawArrowhead = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number
) => {
  const a1 = angle + Math.PI * 0.82;
  const a2 = angle - Math.PI * 0.82;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + ARROW_SIZE * Math.cos(a1), y + ARROW_SIZE * Math.sin(a1));
  ctx.lineTo(x + ARROW_SIZE * Math.cos(a2), y + ARROW_SIZE * Math.sin(a2));
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
        drawArrowhead(
          ctx,
          shape.cx + shape.r * 0.72,
          shape.cy + shape.r * 0.72,
          Math.PI * 0.55
        );
      }
    } else {
      ctx.moveTo(shape.x1, shape.y1);
      ctx.quadraticCurveTo(shape.cx, shape.cy, shape.x2, shape.y2);
      ctx.stroke();
      if (directed) {
        drawArrowhead(ctx, shape.x2, shape.y2, lineEndAngle(shape));
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
    const source = graph.nodes.find((node) => node.id === draft.sourceId);
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
    const source = graph.nodes.find((node) => node.id === draft.sourceId);
    if (source) {
      ctx.beginPath();
      ctx.arc(source.x, source.y, nodeRadius + 3.5, 0, Math.PI * 2);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = colors.edge;
      ctx.stroke();
    }
  }
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function graphBounds(
  graph: Graph,
  nodeRadius: number
): { x: number; y: number; width: number; height: number } {
  const pad = nodeRadius * 3 + 12;
  if (graph.nodes.length === 0) {
    return { x: 0, y: 0, width: 2 * pad, height: 2 * pad };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of graph.nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

const arrowPoints = (x: number, y: number, angle: number): string => {
  const a1 = angle + Math.PI * 0.82;
  const a2 = angle - Math.PI * 0.82;
  const p = (a: number) =>
    `${(x + ARROW_SIZE * Math.cos(a)).toFixed(2)},${(y + ARROW_SIZE * Math.sin(a)).toFixed(2)}`;
  return `${x.toFixed(2)},${y.toFixed(2)} ${p(a1)} ${p(a2)}`;
};

export function buildSvg(
  graph: Graph,
  options: Omit<RenderOptions, 'draft'>
): string {
  const { directed, nodeRadius, colors } = options;
  const bounds = graphBounds(graph, nodeRadius);
  const fontSize = Math.max(14, nodeRadius * 0.85);
  const parts: string[] = [];

  parts.push(
    `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${colors.background}"/>`
  );

  const shapes = edgeShapes(graph, nodeRadius);
  for (const { shape } of shapes) {
    if (shape.kind === 'loop') {
      parts.push(
        `<circle cx="${shape.cx}" cy="${shape.cy}" r="${shape.r}" fill="none" stroke="${colors.edge}" stroke-width="1.6"/>`
      );
      if (directed) {
        parts.push(
          `<polygon points="${arrowPoints(shape.cx + shape.r * 0.72, shape.cy + shape.r * 0.72, Math.PI * 0.55)}" fill="${colors.edge}"/>`
        );
      }
    } else {
      parts.push(
        `<path d="M ${shape.x1.toFixed(2)} ${shape.y1.toFixed(2)} Q ${shape.cx.toFixed(2)} ${shape.cy.toFixed(2)} ${shape.x2.toFixed(2)} ${shape.y2.toFixed(2)}" fill="none" stroke="${colors.edge}" stroke-width="1.6"/>`
      );
      if (directed) {
        parts.push(
          `<polygon points="${arrowPoints(shape.x2, shape.y2, lineEndAngle(shape))}" fill="${colors.edge}"/>`
        );
      }
    }
  }

  for (const { edge, shape } of shapes) {
    if (!edge.weight) continue;
    const mid = edgeMidpoint(shape);
    const w = edge.weight.length * fontSize * 0.5 + 8;
    const h = fontSize * 0.85 + 4;
    parts.push(
      `<rect x="${(mid.x - w / 2).toFixed(2)}" y="${(mid.y - h / 2).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" fill="${colors.background}"/>` +
        `<text x="${mid.x.toFixed(2)}" y="${mid.y.toFixed(2)}" font-family="${FONT_FAMILY}" font-size="${(fontSize * 0.85).toFixed(2)}" fill="${colors.label}" text-anchor="middle" dominant-baseline="central">${escapeXml(edge.weight)}</text>`
    );
  }

  for (const node of graph.nodes) {
    parts.push(
      `<circle cx="${node.x.toFixed(2)}" cy="${node.y.toFixed(2)}" r="${nodeRadius}" fill="${colors.node}" stroke="${colors.label}" stroke-width="1.8"/>`
    );
    if (node.fixed) {
      parts.push(
        `<circle cx="${node.x.toFixed(2)}" cy="${node.y.toFixed(2)}" r="${nodeRadius + 3.5}" fill="none" stroke="${colors.label}" stroke-width="1" opacity="0.45"/>`
      );
    }
    parts.push(
      `<text x="${node.x.toFixed(2)}" y="${node.y.toFixed(2)}" font-family="${FONT_FAMILY}" font-size="${fontSize.toFixed(2)}" fill="${colors.label}" text-anchor="middle" dominant-baseline="central">${escapeXml(node.label)}</text>`
    );
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" width="${bounds.width}" height="${bounds.height}">` +
    parts.join('') +
    `</svg>`
  );
}

export function downloadText(
  filename: string,
  text: string,
  mime: string
): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportPng(
  graph: Graph,
  options: Omit<RenderOptions, 'draft'>,
  filename = 'graph.png'
): void {
  const bounds = graphBounds(graph, options.nodeRadius);
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(bounds.width * scale);
  canvas.height = Math.ceil(bounds.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(scale, scale);
  ctx.translate(-bounds.x, -bounds.y);
  ctx.fillStyle = options.colors.background;
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  drawGraph(ctx, graph, options);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
