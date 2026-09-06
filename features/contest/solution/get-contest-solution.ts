import ServerApis from '@/api/server/method';
import type { ContestSolutionResponse } from '@/api/server/method/contests/solution';
import { cache } from 'react';
import 'server-only';

export const getContestSolution = cache(
  async (tid: string, sid: string): Promise<ContestSolutionResponse> => {
    return await ServerApis.Contests.getContestSolution(tid, sid);
  }
);
