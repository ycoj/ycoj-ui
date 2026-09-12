import type { ScoreboardExportData } from '@/shared/types/contest';

export const SCOREBOARD_EXPORT_DATA_VIEW = 'export-data';

export function exportName(
  data: ScoreboardExportData,
  uid: number,
  realName: boolean
) {
  const user = data.udict[uid];
  return realName && user?.realName?.trim()
    ? user.realName
    : user?.uname || String(uid);
}

export function exportFilename(name: string) {
  return (
    name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/, '') ||
    'export'
  );
}
