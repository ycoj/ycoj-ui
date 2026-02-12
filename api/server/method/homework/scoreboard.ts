import { alova } from '@/api/server';
import type { ScoreboardResponse } from '@/shared/types/contest';

export const getHomeworkScoreboard = (tid: string) =>
  alova.Get<ScoreboardResponse>(`/homework/${tid}/scoreboard`);
