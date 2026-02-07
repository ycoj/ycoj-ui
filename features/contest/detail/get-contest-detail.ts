'server-only';

import ServerApis from '@/api/server/method';
import type { ContestDetailResponse } from '@/api/server/method/contests/detail';
import { cache } from 'react';

export const getContestDetail = cache(
  async (tid: string): Promise<ContestDetailResponse> => {
    return await ServerApis.Contests.getContestDetail(tid);
  }
);
