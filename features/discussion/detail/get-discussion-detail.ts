'server-only';

import ServerApis from '@/api/server/method';
import type { DiscussionDetailResponse } from '@/api/server/method/discussion/detail';
import { cache } from 'react';

export const getDiscussionDetail = cache(
  async (did: string, page?: number): Promise<DiscussionDetailResponse> => {
    return await ServerApis.Discussion.getDiscussionDetail(did, page);
  }
);
