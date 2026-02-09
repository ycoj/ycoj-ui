'server-only';

import ServerApis from '@/api/server/method';
import type { HomeworkDetailResponse } from '@/api/server/method/homework/detail';
import { cache } from 'react';

export const getHomeworkDetail = cache(
  async (tid: string): Promise<HomeworkDetailResponse> => {
    return await ServerApis.Homework.getHomeworkDetail(tid);
  }
);
