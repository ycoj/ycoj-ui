'server-only';

import ServerApis from '@/api/server/method';
import type { TrainingEditResponse } from '@/api/server/method/training/edit';
import { cache } from 'react';

export const getTrainingEdit = cache(
  async (tid: string): Promise<TrainingEditResponse> => {
    return await ServerApis.Training.getTrainingEdit(tid);
  }
);
