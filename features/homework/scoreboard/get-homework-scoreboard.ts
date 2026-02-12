'server-only';

import ServerApis from '@/api/server/method';
import type { ScoreboardResponse } from '@/shared/types/contest';
import { cache } from 'react';

export const getHomeworkScoreboard = cache(
  async (tid: string): Promise<ScoreboardResponse> => {
    return await ServerApis.Homework.getHomeworkScoreboard(tid);
  }
);
