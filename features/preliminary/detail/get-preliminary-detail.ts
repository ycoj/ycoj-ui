import ServerApis from '@/api/server/method';
import type { PreliminaryDetailResponse } from '@/api/server/method/preliminary/detail';
import { cache } from 'react';
import 'server-only';

export const getPreliminaryDetail = cache(
  async (paperId: string): Promise<PreliminaryDetailResponse> => {
    return await ServerApis.Preliminary.getPreliminaryDetail(paperId);
  }
);
