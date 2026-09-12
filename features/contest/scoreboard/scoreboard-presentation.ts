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

export type ScoreboardRecordRun = {
  text: string;
  tone: 'normal' | 'partial';
};

const CHECK_ICON = '<span class="icon icon-check"></span>';
const PARTIAL_SPAN = /<span style="color:orange">([^<]*)<\/span>/g;

/**
 * Interprets the small Hydro record markup subset the scoreboard uses:
 * check icons become `✓` and orange spans mark partial scores. Stray HTML is
 * left as literal text so unrecognized markup degrades to visible content.
 */
export function parseScoreboardRecord(value: string): ScoreboardRecordRun[] {
  const text = value.replaceAll(CHECK_ICON, '✓');
  const runs: ScoreboardRecordRun[] = [];
  let offset = 0;
  for (const match of text.matchAll(PARTIAL_SPAN)) {
    runs.push({ text: text.slice(offset, match.index), tone: 'normal' });
    runs.push({ text: match[1], tone: 'partial' });
    offset = match.index + match[0].length;
  }
  runs.push({ text: text.slice(offset), tone: 'normal' });
  return runs.filter((run) => run.text);
}
