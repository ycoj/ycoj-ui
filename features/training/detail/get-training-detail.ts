'server-only';

import ServerApis from '@/api/server/method';
import type { TrainingDetailResponse } from '@/api/server/method/training/detail';
import { cache } from 'react';

export const getTrainingDetail = cache(
  async (tid: string): Promise<TrainingDetailResponse> => {
    return await ServerApis.Training.getTrainingDetail(tid);
  }
);
