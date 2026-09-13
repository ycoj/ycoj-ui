import {
  edgeMidpoint,
  edgeShapes,
  lineArrowhead,
  loopArrowhead,
  type Arrowhead,
} from './graph-geometry';
import { drawGraph, FONT_FAMILY, type RenderOptions } from './graph-render';
import type { Graph } from './graph-types';

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

const arrowPoints = (arrow: Arrowhead): string =>
  [arrow.tip, arrow.left, arrow.right]
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');

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
          `<polygon points="${arrowPoints(loopArrowhead(shape))}" fill="${colors.edge}"/>`
        );
      }
    } else {
      parts.push(
        `<path d="M ${shape.x1.toFixed(2)} ${shape.y1.toFixed(2)} Q ${shape.cx.toFixed(2)} ${shape.cy.toFixed(2)} ${shape.x2.toFixed(2)} ${shape.y2.toFixed(2)}" fill="none" stroke="${colors.edge}" stroke-width="1.6"/>`
      );
      if (directed) {
        parts.push(
          `<polygon points="${arrowPoints(lineArrowhead(shape))}" fill="${colors.edge}"/>`
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
