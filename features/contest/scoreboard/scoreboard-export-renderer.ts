import { loadExportAvatar } from './scoreboard-export-avatar';
import { buildScoreboardSvg, type ExportLabels } from './scoreboard-export-svg';
import {
  exportFilename,
  exportName,
  type ScoreboardExportOptions,
  type ScoreboardImageData,
} from './scoreboard-export-utils';
import { renderAsync } from '@resvg/resvg-js';
import JSZip from 'jszip';
import path from 'node:path';
import 'server-only';

export const MAX_EXPORT_PARTICIPANTS = 250;
export const MAX_EXPORT_PNG_BYTES = 64 * 1024 * 1024;
export const EXPORT_DEADLINE_MS = 60_000;

export async function renderScoreboardFile(
  data: ScoreboardImageData,
  options: ScoreboardExportOptions,
  labels: ExportLabels,
  signal: AbortSignal
) {
  const exportSignal = AbortSignal.any([
    signal,
    AbortSignal.timeout(EXPORT_DEADLINE_MS),
  ]);
  const avatars: Record<number, string> = {};
  const capture = async (uid?: number) => {
    exportSignal.throwIfAborted();
    const svg = buildScoreboardSvg(data, options, labels, avatars, uid);
    const image = await renderAsync(
      svg,
      {
        font: {
          loadSystemFonts: false,
          fontFiles: [
            path.join(process.cwd(), 'public/fonts/NotoSansCJKsc-Regular.otf'),
          ],
          defaultFontFamily: 'Noto Sans CJK SC',
        },
      },
      // The native renderer attaches state to the signal; use a fresh one per image.
      AbortSignal.any([exportSignal])
    );
    return image.asPng();
  };
  const uids = Object.keys(data.udict).map(Number);
  if (uids.length > MAX_EXPORT_PARTICIPANTS)
    throw new Error('Scoreboard export exceeds the participant limit');
  if (!options.details) {
    if (options.avatar)
      for (const uid of uids)
        avatars[uid] = await loadExportAvatar(
          data.udict[uid].avatar,
          exportSignal
        );
    return {
      body: await capture(),
      contentType: 'image/png',
      filename: `${exportFilename(data.tdoc.title)}.png`,
    };
  }
  const zip = new JSZip();
  let pngBytes = 0;
  for (const uid of uids) {
    exportSignal.throwIfAborted();
    if (options.avatar)
      avatars[uid] = await loadExportAvatar(
        data.udict[uid].avatar,
        exportSignal
      );
    const png = await capture(uid);
    pngBytes += png.byteLength;
    if (pngBytes > MAX_EXPORT_PNG_BYTES)
      throw new Error('Scoreboard export exceeds the PNG byte limit');
    zip.file(
      `${uid}-${exportFilename(exportName(data, uid, options.realName))}.png`,
      png
    );
    delete avatars[uid];
  }
  return {
    body: await zip.generateAsync({ type: 'nodebuffer' }),
    contentType: 'application/zip',
    filename: `${exportFilename(data.tdoc.title)}.zip`,
  };
}
