'server-only';

import ServerApis from '@/api/server/method';
import type { ContestEditResponse } from '@/api/server/method/contests/edit';
import { cache } from 'react';

export const getContestEdit = cache(
  async (tid: string): Promise<ContestEditResponse> => {
    return await ServerApis.Contests.getContestEdit(tid);
  }
);
