import {
  exportName,
  type ScoreboardExportOptions,
  type ScoreboardImageData,
} from './scoreboard-export-utils';
import {
  getOwnedBalloonColors,
  getProblemBalloonColors,
  getScoreColor,
} from './scoreboard-presentation';
import { STATUS_TEXT_KEYS } from '@/shared/configs/status';
import type { ScoreboardNode } from '@/shared/types/contest';

export type ExportLabels = {
  details: string;
  noSubmissions: string;
  columns: string[];
  statuses: Record<string, string>;
};

type TextRun = { text: string; color?: string };
type Cell = {
  text: string;
  avatar?: string;
  bold?: boolean;
  balloons?: string[];
  runs?: TextRun[];
};
const FONT_SIZE = 16;
const LINE_HEIGHT = 24;
const PADDING = 12;
const MARGIN = 32;

function escapeXml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[char]!
  );
}

function wrap(text: string, width: number, fontSize = FONT_SIZE) {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    let used = 0;
    for (const char of paragraph) {
      const size = char.charCodeAt(0) < 128 ? fontSize * 0.65 : fontSize;
      if (used + size > width && line) {
        lines.push(line);
        line = '';
        used = 0;
      }
      line += char;
      used += size;
    }
    lines.push(line);
  }
  return lines;
}

export function buildScoreboardSvg(
  data: ScoreboardImageData,
  options: ScoreboardExportOptions,
  labels: ExportLabels,
  avatars: Record<number, string>,
  uid?: number
) {
  const rows =
    uid === undefined
      ? data.rows
      : data.rows.filter(
          (row, index) =>
            index === 0 ||
            row.some((cell) => cell.type === 'user' && cell.raw === uid)
        );
  const problemColors = getProblemBalloonColors(data.rows[0] || []);
  function recordRuns(node: ScoreboardNode): TextRun[] {
    if (node.type === 'records' && Array.isArray(node.raw)) {
      const records = node.raw.filter(
        (value): value is { value: string | number; score?: number } =>
          typeof value === 'object' &&
          value !== null &&
          'value' in value &&
          (typeof value.value === 'string' || typeof value.value === 'number')
      );
      if (records.length)
        return records.flatMap((record, index) => [
          ...(index ? [{ text: ' / ' }] : []),
          ...recordRuns({ ...record, type: 'record' }),
        ]);
    }
    if (node.type !== 'record') return [{ text: String(node.value) }];
    const color = getScoreColor(
      typeof node.value === 'number' ? node.value : (node.score ?? 0)
    ).color;
    const text = String(node.value).replaceAll(
      '<span class="icon icon-check"></span>',
      '✓'
    );
    const runs: TextRun[] = [];
    let offset = 0;
    for (const match of text.matchAll(
      /<span style="color:orange">([^<]*)<\/span>/g
    )) {
      runs.push({ text: text.slice(offset, match.index), color });
      runs.push({ text: match[1], color: getScoreColor(60).color });
      offset = match.index + match[0].length;
    }
    runs.push({ text: text.slice(offset), color });
    return runs;
  }
  const scoreboard: Cell[][] = rows.map((row, rowIndex) =>
    row.map((cell, columnIndex) => {
      if (rowIndex === 0 && cell.type === 'problem') {
        const problem =
          typeof cell.raw === 'number' || typeof cell.raw === 'string'
            ? data.pdict[cell.raw as number]
            : undefined;
        return {
          text: `${cell.value}${problem?.title ? `\n${problem.title}` : ''}`,
          bold: true,
        };
      }
      if (cell.type === 'user' && typeof cell.raw === 'number')
        return {
          text: exportName(data, cell.raw, options.realName),
          avatar: options.avatar ? avatars[cell.raw] : undefined,
          balloons: getOwnedBalloonColors(row, problemColors),
          bold: true,
        };
      const runs = recordRuns(cell);
      const balloon = problemColors.get(columnIndex);
      return {
        text: runs.map((run) => run.text).join(''),
        runs,
        bold: cell.type === 'record' || cell.type === 'records',
        balloons: cell.first && balloon ? [balloon] : undefined,
      };
    })
  );
  const fragments: string[] = [];
  let y = MARGIN;
  let width = 800;
  function heading(text: string, fontSize = 24) {
    const lines = wrap(text, 720, fontSize);
    for (const line of lines) {
      fragments.push(
        `<text x="${MARGIN}" y="${y + fontSize}" font-size="${fontSize}" font-weight="600">${escapeXml(line)}</text>`
      );
      y += fontSize + 12;
    }
    y += 12;
  }
  function balloon(x: number, top: number, color: string) {
    fragments.push(
      `<g transform="translate(${x} ${top})" fill="${color}" stroke="${color}" stroke-width="1.5"><ellipse cx="7" cy="7" rx="5" ry="6"/><path d="M7 13l-1 2h2zM7 15c-4 3 4 4 0 7" fill="none"/></g>`
    );
  }
  function table(cells: Cell[][]) {
    if (!cells.length) return;
    const columnCount = Math.max(...cells.map((row) => row.length));
    const widths = Array.from({ length: columnCount }, (_, i) =>
      Math.max(
        100,
        ...cells.map(
          (row) =>
            Math.min(
              260,
              Math.max(
                ...(row[i]?.text || '')
                  .split('\n')
                  .map((line) => Array.from(line).length * 13)
              )
            ) +
            PADDING * 2 +
            (row[i]?.avatar ? 40 : 0) +
            (row[i]?.balloons?.length || 0) * 18
        )
      )
    );
    width = Math.max(
      width,
      widths.reduce((total, w) => total + w, MARGIN * 2)
    );
    cells.forEach((row, index) => {
      const wrapped = widths.map((w, i) =>
        wrap(
          row[i]?.text || '',
          w -
            PADDING * 2 -
            (row[i]?.avatar ? 40 : 0) -
            (row[i]?.balloons?.length || 0) * 18
        )
      );
      const height = Math.max(
        44,
        ...wrapped.map((lines) => lines.length * LINE_HEIGHT + PADDING * 2)
      );
      let x = MARGIN;
      widths.forEach((w, i) => {
        fragments.push(
          `<rect x="${x}" y="${y}" width="${w}" height="${height}" fill="#fff"/>`
        );
        fragments.push(`<path d="M${x} ${y + height}h${w}" stroke="#e5e5e5"/>`);
        const image = row[i]?.avatar;
        if (image)
          fragments.push(
            `<image x="${x + PADDING}" y="${y + PADDING}" width="32" height="32" href="${escapeXml(image)}"/>`
          );
        const cell = row[i];
        const colors = (cell?.runs || [{ text: cell?.text || '' }]).flatMap(
          (run) => Array.from(run.text).map(() => run.color || '#171717')
        );
        let offset = 0;
        wrapped[i].forEach((line, lineIndex) => {
          if (lineIndex && Array.from(cell?.text || '')[offset] === '\n')
            offset++;
          const runs: TextRun[] = [];
          for (const char of line) {
            const color = colors[offset++] || '#171717';
            const last = runs.at(-1);
            if (last?.color === color) last.text += char;
            else runs.push({ text: char, color });
          }
          const text = runs
            .map(
              (run) =>
                `<tspan fill="${run.color}">${escapeXml(run.text)}</tspan>`
            )
            .join('');
          fragments.push(
            `<text x="${x + PADDING + (image ? 40 : 0)}" y="${y + (height - wrapped[i].length * LINE_HEIGHT) / 2 + FONT_SIZE + lineIndex * LINE_HEIGHT}" font-weight="${index === 0 || cell?.bold ? 600 : 400}">${text}</text>`
          );
        });
        cell?.balloons?.forEach((color, balloonIndex) =>
          balloon(
            x + w - PADDING - (cell.balloons!.length - balloonIndex) * 18,
            y + (height - 24) / 2,
            color
          )
        );
        x += w;
      });
      y += height;
    });
    y += 24;
  }
  heading(data.tdoc.title);
  if (uid !== undefined) heading(exportName(data, uid, options.realName), 20);
  table(scoreboard);
  if (uid !== undefined) {
    heading(labels.details, 20);
    const entries = data.submissions?.[uid] || [];
    table([
      labels.columns.map((text) => ({ text })),
      ...entries.map((entry) =>
        [
          entry.rid,
          data.pdict[entry.pid]?.title || String(entry.pid),
          new Date(entry.submittedAt).toISOString(),
          labels.statuses[STATUS_TEXT_KEYS[entry.status] || 'unknownError'],
          String(entry.score),
          entry.lang || '—',
        ].map((text) => ({ text }))
      ),
    ]);
    if (!entries.length) heading(labels.noSubmissions, 16);
  }
  const height = y + MARGIN;
  if (width * height > 40_000_000)
    throw new Error('Scoreboard image exceeds the rendering limit');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#fff"/><g font-family="Noto Sans CJK SC" font-size="${FONT_SIZE}" fill="#0f172a">${fragments.join('')}</g></svg>`;
}
