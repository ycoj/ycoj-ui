import {
  exportName,
  type ScoreboardExportOptions,
  type ScoreboardImageData,
} from './scoreboard-export-utils';
import { STATUS_TEXT_KEYS } from '@/shared/configs/status';

export type ExportLabels = {
  details: string;
  noSubmissions: string;
  columns: string[];
  statuses: Record<string, string>;
};

type Cell = { text: string; avatar?: string };
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
  const scoreboard: Cell[][] = rows.map((row) =>
    row.map((cell) => {
      if (cell.type !== 'user' || typeof cell.raw !== 'number')
        return { text: String(cell.value) };
      return {
        text: exportName(data, cell.raw, options.realName),
        avatar: options.avatar ? avatars[cell.raw] : undefined,
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
        `<text x="${MARGIN}" y="${y + fontSize}" font-size="${fontSize}">${escapeXml(line)}</text>`
      );
      y += fontSize + 12;
    }
    y += 12;
  }
  function table(cells: Cell[][]) {
    if (!cells.length) return;
    const columnCount = Math.max(...cells.map((row) => row.length));
    const widths = Array.from({ length: columnCount }, (_, i) =>
      Math.min(
        300,
        Math.max(
          100,
          ...cells.map(
            (row) =>
              Math.min(260, Array.from(row[i]?.text || '').length * 13) +
              PADDING * 2 +
              (row[i]?.avatar ? 40 : 0)
          )
        )
      )
    );
    width = Math.max(
      width,
      widths.reduce((total, w) => total + w, MARGIN * 2)
    );
    cells.forEach((row, index) => {
      const wrapped = widths.map((w, i) =>
        wrap(row[i]?.text || '', w - PADDING * 2 - (row[i]?.avatar ? 40 : 0))
      );
      const height = Math.max(
        44,
        ...wrapped.map((lines) => lines.length * LINE_HEIGHT + PADDING * 2)
      );
      let x = MARGIN;
      widths.forEach((w, i) => {
        fragments.push(
          `<rect x="${x}" y="${y}" width="${w}" height="${height}" fill="${index === 0 ? '#f1f5f9' : '#fff'}" stroke="#cbd5e1"/>`
        );
        const image = row[i]?.avatar;
        if (image)
          fragments.push(
            `<image x="${x + PADDING}" y="${y + PADDING}" width="32" height="32" href="${escapeXml(image)}"/>`
          );
        wrapped[i].forEach((line, lineIndex) =>
          fragments.push(
            `<text x="${x + PADDING + (image ? 40 : 0)}" y="${y + PADDING + FONT_SIZE + lineIndex * LINE_HEIGHT}">${escapeXml(line)}</text>`
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
