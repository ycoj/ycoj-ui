'server-only';

import ServerApis from '@/api/server/method';
import type {
  ProblemDetailData,
  ProblemDetailResponse,
} from '@/api/server/method/problems/detail';
import { cache } from 'react';

export const getProblemDetail = cache(
  async (pid: string, tid?: string): Promise<ProblemDetailResponse> => {
    return await ServerApis.Problems.getProblemDetail(pid, tid);
  }
);

export type { ProblemDetailData };
