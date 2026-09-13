import { alova } from '@/api/server';
import type {
  ScoreboardExportData,
  ScoreboardExportOptions,
  ScoreboardExportResponse,
  ScoreboardResponse,
} from '@/shared/types/contest';
import type { Errorable } from '@/shared/types/error';

export const getContestScoreboard = (tid: string, realtime?: boolean) =>
  alova.Get<ScoreboardResponse>(`/contest/${tid}/scoreboard`, {
    params: { ...(realtime ? { realtime: true } : {}) },
  });

export const getScoreboardExportData = async (
  pageType: 'contest' | 'homework',
  tid: string,
  options: Pick<ScoreboardExportOptions, 'realName' | 'details'>
): Promise<Errorable<ScoreboardExportData>> => {
  if (options.realName || options.details)
    return alova.Get<Errorable<ScoreboardExportResponse>>(
      `/${pageType}/${tid}/scoreboard/export-data`,
      { params: { details: options.details } }
    );
  const data = await alova.Get<Errorable<ScoreboardResponse>>(
    `/${pageType}/${tid}/scoreboard`
  );
  if ('error' in data) return data;
  return {
    tdoc: data.tdoc,
    rows: data.rows,
    pdict: data.pdict,
    udict: Object.fromEntries(
      Object.entries(data.udict).map(([uid, user]) => [
        uid,
        {
          uname: user.uname,
          avatar: user.avatar,
          ...(typeof user.realName === 'string' && user.realName.trim()
            ? { realName: user.realName }
            : {}),
        },
      ])
    ),
  };
};
