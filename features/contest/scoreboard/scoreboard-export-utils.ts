import type {
  ScoreboardExportResponse,
  ScoreboardResponse,
} from '@/shared/types/contest';

export type ScoreboardImageData = Pick<
  ScoreboardResponse,
  'tdoc' | 'rows' | 'pdict'
> & {
  udict: Record<number, { uname: string; avatar: string; realName?: unknown }>;
  submissions?: ScoreboardExportResponse['submissions'];
};

export type ScoreboardExportOptions = {
  avatar: boolean;
  realName: boolean;
  details: boolean;
};

export function exportName(
  data: ScoreboardImageData,
  uid: number,
  realName: boolean
) {
  const user = data.udict[uid];
  return realName && typeof user?.realName === 'string' && user.realName.trim()
    ? user.realName
    : user?.uname || String(uid);
}

export function exportFilename(name: string) {
  return (
    name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/, '') ||
    'export'
  );
}
