import { alova } from '@/api/server';
import type { ScoreboardResponse } from '@/shared/types/contest';

export const getContestScoreboard = (tid: string, realtime?: boolean) =>
  alova.Get<ScoreboardResponse>(`/contest/${tid}/scoreboard`, {
    params: { ...(realtime ? { realtime: true } : {}) },
  });
