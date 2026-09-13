import { finalizeScoreboardArchive } from './scoreboard-export-archive';
import {
  MAX_AVATAR_DATA_URI_PREFIX,
  MAX_EXPORT_AVATAR_BYTES,
  MAX_EXPORT_AVATAR_PIXELS,
  MAX_EXPORT_AVATAR_TOTAL_BYTES,
  MAX_EXPORT_AVATAR_TOTAL_PIXELS,
  loadExportAvatar,
} from './scoreboard-export-avatar';
import {
  ScoreboardExportBusyError,
  ScoreboardExportLimitError,
} from './scoreboard-export-errors';
import { buildScoreboardSvg, type ExportLabels } from './scoreboard-export-svg';
import { exportFilename, exportName } from './scoreboard-export-utils';
import type {
  ScoreboardExportData,
  ScoreboardExportOptions,
} from '@/shared/types/contest';
import { renderAsync } from '@resvg/resvg-js';
import JSZip from 'jszip';
import path from 'node:path';
import 'server-only';

export const MAX_EXPORT_PARTICIPANTS = 250;
export const MAX_EXPORT_DETAIL_PARTICIPANTS = 20;
export const MAX_EXPORT_PNG_BYTES = 64 * 1024 * 1024;
export const EXPORT_DEADLINE_MS = 300_000;
export const MAX_CONCURRENT_EXPORTS = 2;

let activeExports = 0;

function rawBytesForEmbeddedBudget(embeddedBytes: number) {
  return Math.max(
    0,
    Math.floor((embeddedBytes - MAX_AVATAR_DATA_URI_PREFIX) / 4) * 3
  );
}

export async function loadExportAvatars(
  uids: number[],
  udict: ScoreboardExportData['udict'],
  signal: AbortSignal
) {
  const avatars: Record<number, string> = {};
  let retainedBytes = 0;
  let retainedPixels = 0;
  for (const uid of uids) {
    const byteAllowance = Math.min(
      MAX_EXPORT_AVATAR_BYTES,
      rawBytesForEmbeddedBudget(MAX_EXPORT_AVATAR_TOTAL_BYTES - retainedBytes)
    );
    const pixelAllowance = Math.min(
      MAX_EXPORT_AVATAR_PIXELS,
      MAX_EXPORT_AVATAR_TOTAL_PIXELS - retainedPixels
    );
    if (byteAllowance <= 0 || pixelAllowance <= 0) break;
    const avatar = await loadExportAvatar(
      udict[uid].avatar,
      signal,
      byteAllowance,
      pixelAllowance
    );
    if (!avatar) continue;
    avatars[uid] = avatar.dataUri;
    retainedBytes += avatar.dataUri.length;
    retainedPixels += avatar.pixels;
  }
  return avatars;
}

export async function renderScoreboardFile(
  data: ScoreboardExportData,
  options: ScoreboardExportOptions,
  labels: ExportLabels,
  signal: AbortSignal
) {
  if (activeExports >= MAX_CONCURRENT_EXPORTS)
    throw new ScoreboardExportBusyError();
  activeExports += 1;
  try {
    return await renderScoreboardFileContents(data, options, labels, signal);
  } finally {
    activeExports -= 1;
  }
}

async function renderScoreboardFileContents(
  data: ScoreboardExportData,
  options: ScoreboardExportOptions,
  labels: ExportLabels,
  signal: AbortSignal
) {
  const exportSignal = AbortSignal.any([
    signal,
    AbortSignal.timeout(EXPORT_DEADLINE_MS),
  ]);
  let avatars: Record<number, string> = {};
  const capture = async (uid?: number) => {
    exportSignal.throwIfAborted();
    const svg = buildScoreboardSvg(data, options, labels, avatars, uid);
    const image = await renderAsync(
      svg,
      {
        font: {
          loadSystemFonts: false,
          fontFiles: [
            path.join(process.cwd(), 'assets/fonts/NotoSansCJKsc-Regular.otf'),
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
  const participantLimit = options.details
    ? MAX_EXPORT_DETAIL_PARTICIPANTS
    : MAX_EXPORT_PARTICIPANTS;
  if (uids.length > participantLimit)
    throw new ScoreboardExportLimitError(
      'Scoreboard export exceeds the participant limit'
    );
  if (options.avatar)
    avatars = await loadExportAvatars(uids, data.udict, exportSignal);
  const overview = await capture();
  if (!options.details) {
    return {
      body: overview,
      contentType: 'image/png',
      filename: `${exportFilename(data.tdoc.title)}.png`,
    };
  }
  const zip = new JSZip();
  let pngBytes = overview.byteLength;
  if (pngBytes > MAX_EXPORT_PNG_BYTES)
    throw new ScoreboardExportLimitError(
      'Scoreboard export exceeds the PNG byte limit'
    );
  zip.file('scoreboard.png', overview);
  for (const uid of uids) {
    exportSignal.throwIfAborted();
    const png = await capture(uid);
    pngBytes += png.byteLength;
    if (pngBytes > MAX_EXPORT_PNG_BYTES)
      throw new ScoreboardExportLimitError(
        'Scoreboard export exceeds the PNG byte limit'
      );
    zip.file(
      `${uid}-${exportFilename(exportName(data, uid, options.realName))}.png`,
      png
    );
    delete avatars[uid];
  }
  return {
    body: await finalizeScoreboardArchive(zip, exportSignal),
    contentType: 'application/zip',
    filename: `${exportFilename(data.tdoc.title)}.zip`,
  };
}
