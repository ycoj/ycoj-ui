import ServerApis from '@/api/server/method';
import type { HomeworkEditResponse } from '@/api/server/method/homework/edit';
import { cache } from 'react';
import 'server-only';

export const getHomeworkEdit = cache(
  async (tid: string): Promise<HomeworkEditResponse> => {
    return await ServerApis.Homework.getHomeworkEdit(tid);
  }
);
