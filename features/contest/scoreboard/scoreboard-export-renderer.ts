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

export async function renderScoreboardFile(
  data: ScoreboardImageData,
  options: ScoreboardExportOptions,
  labels: ExportLabels,
  signal: AbortSignal
) {
  const avatars: Record<number, string> = {};
  const capture = async (uid?: number) => {
    signal.throwIfAborted();
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
      AbortSignal.any([signal])
    );
    return image.asPng();
  };
  const uids = Object.keys(data.udict).map(Number);
  if (!options.details) {
    if (options.avatar)
      for (const uid of uids)
        avatars[uid] = await loadExportAvatar(data.udict[uid].avatar, signal);
    return {
      body: await capture(),
      contentType: 'image/png',
      filename: `${exportFilename(data.tdoc.title)}.png`,
    };
  }
  const zip = new JSZip();
  for (const uid of uids) {
    signal.throwIfAborted();
    if (options.avatar)
      avatars[uid] = await loadExportAvatar(data.udict[uid].avatar, signal);
    zip.file(
      `${uid}-${exportFilename(exportName(data, uid, options.realName))}.png`,
      await capture(uid)
    );
    delete avatars[uid];
  }
  return {
    body: await zip.generateAsync({ type: 'nodebuffer' }),
    contentType: 'application/zip',
    filename: `${exportFilename(data.tdoc.title)}.zip`,
  };
}
