import ServerApis from '@/api/server/method';
import type { ProblemSolutionResponse } from '@/api/server/method/problems/solution';
import type { Errorable } from '@/shared/types/error';
import { cache } from 'react';
import 'server-only';

export const getProblemSolution = cache(
  async (
    pid: string,
    sid?: string,
    page?: number
  ): Promise<Errorable<ProblemSolutionResponse>> => {
    return await ServerApis.Problems.getProblemSolution(pid, sid, page);
  }
);
