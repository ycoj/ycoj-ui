import type { ColorOverrides, ResolvedColors } from './graph-types';

export const FALLBACK_COLORS: ResolvedColors = {
  node: '#ffffff',
  label: '#1a1a1a',
  edge: '#1a1a1a',
  background: '#ffffff',
};

const readVar = (name: string, fallback: string): string => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

let probe: CanvasRenderingContext2D | null | undefined;

// CSS variables may resolve to oklch() or other notations that <input
// type="color"> and exported SVG cannot use; paint one pixel and read it
// back to normalize any CSS color to #rrggbb.
const toHexColor = (value: string, fallback: string): string => {
  if (probe === undefined) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    probe = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!probe) return fallback;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000000';
  probe.fillStyle = value;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  const hex = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
};

export function resolveColors(overrides: ColorOverrides): ResolvedColors {
  const card = readVar('--card', FALLBACK_COLORS.background);
  const foreground = readVar('--foreground', FALLBACK_COLORS.label);
  return {
    node: toHexColor(overrides.node ?? card, FALLBACK_COLORS.node),
    label: toHexColor(overrides.label ?? foreground, FALLBACK_COLORS.label),
    edge: toHexColor(overrides.edge ?? foreground, FALLBACK_COLORS.edge),
    background: toHexColor(card, FALLBACK_COLORS.background),
  };
}
