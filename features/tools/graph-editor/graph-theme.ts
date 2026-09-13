import type { ColorOverrides, ResolvedColors } from './graph-types';

const FALLBACKS = {
  card: '#ffffff',
  foreground: '#1a1a1a',
};

const readVar = (name: string, fallback: string): string => {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
};

export function resolveColors(overrides: ColorOverrides): ResolvedColors {
  const card = readVar('--card', FALLBACKS.card);
  const foreground = readVar('--foreground', FALLBACKS.foreground);
  return {
    node: overrides.node ?? card,
    label: overrides.label ?? foreground,
    edge: overrides.edge ?? foreground,
    background: card,
  };
}
