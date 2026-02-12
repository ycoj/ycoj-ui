'server-only';

import ServerApis from '@/api/server/method';
import type { ScoreboardResponse } from '@/shared/types/contest';
import { cache } from 'react';

export const getContestScoreboard = cache(
  async (tid: string, realtime?: boolean): Promise<ScoreboardResponse> => {
    return await ServerApis.Contests.getContestScoreboard(tid, realtime);
  }
);
