import { alova } from '@/api/server';
import type {
  ScoreboardExportResponse,
  ScoreboardResponse,
} from '@/shared/types/contest';
import type { Errorable } from '@/shared/types/error';

export const getContestScoreboard = (tid: string, realtime?: boolean) =>
  alova.Get<ScoreboardResponse>(`/contest/${tid}/scoreboard`, {
    params: { ...(realtime ? { realtime: true } : {}) },
  });

export const getScoreboardExportData = (
  pageType: 'contest' | 'homework',
  tid: string,
  options: { realName: boolean; details: boolean }
) =>
  options.realName || options.details
    ? alova.Get<Errorable<ScoreboardExportResponse>>(
        `/${pageType}/${tid}/scoreboard/export-data`,
        { params: { details: options.details } }
      )
    : alova.Get<Errorable<ScoreboardResponse>>(
        `/${pageType}/${tid}/scoreboard`
      );
