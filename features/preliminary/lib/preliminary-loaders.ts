import ServerApis from '@/api/server/method';
import type { PreliminaryAttemptResponse } from '@/api/server/method/preliminary/attempt';
import type { PreliminaryDetailResponse } from '@/api/server/method/preliminary/detail';
import { cache } from 'react';
import 'server-only';

export const getPreliminaryDetail = cache(
  async (paperId: string): Promise<PreliminaryDetailResponse> => {
    return await ServerApis.Preliminary.getPreliminaryDetail(paperId);
  }
);

export const getPreliminaryAttempt = cache(
  async (
    paperId: string,
    attemptId: string
  ): Promise<PreliminaryAttemptResponse> => {
    return await ServerApis.Preliminary.getPreliminaryAttempt(
      paperId,
      attemptId
    );
  }
);
