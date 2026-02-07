'server-only';

import ServerApis from '@/api/server/method';
import type { ProblemSolutionResponse } from '@/api/server/method/problems/solution';
import { cache } from 'react';

export const getProblemSolution = cache(
  async (
    pid: string,
    sid?: string,
    page?: number
  ): Promise<ProblemSolutionResponse> => {
    return await ServerApis.Problems.getProblemSolution(pid, sid, page);
  }
);
