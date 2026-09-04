import ServerApis from '@/api/server/method';
import type { PreliminaryAttemptResponse } from '@/api/server/method/preliminary/attempt';
import { cache } from 'react';
import 'server-only';

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
