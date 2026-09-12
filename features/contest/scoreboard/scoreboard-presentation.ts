import type { ScoreboardRow } from '@/shared/types/contest';

const ICPC_BALLOON_COLORS = [
  '#dc2626',
  '#2563eb',
  '#facc15',
  '#16a34a',
  '#f97316',
  '#9333ea',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#64748b',
];

export function getProblemBalloonColors(
  headerRow: ScoreboardRow
): Map<number, string> {
  const colors = new Map<number, string>();
  let problemIndex = 0;
  headerRow.forEach((node, columnIndex) => {
    if (node.type === 'problem') {
      colors.set(
        columnIndex,
        ICPC_BALLOON_COLORS[problemIndex % ICPC_BALLOON_COLORS.length]
      );
      problemIndex += 1;
    }
  });
  return colors;
}

export function getOwnedBalloonColors(
  row: ScoreboardRow,
  problemColors: Map<number, string>
): string[] {
  return row.flatMap((node, columnIndex) => {
    const color = problemColors.get(columnIndex);
    return node.first === true && color ? [color] : [];
  });
}

export function getScoreColor(score: number) {
  if (score >= 100) return { className: 'text-green-600', color: '#16a34a' };
  if (score >= 60) return { className: 'text-orange-500', color: '#f97316' };
  return { className: 'text-red-500', color: '#ef4444' };
}
