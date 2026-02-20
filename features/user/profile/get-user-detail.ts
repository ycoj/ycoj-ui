'server-only';

import ServerApis from '@/api/server/method';
import type { UserDetailResponse } from '@/api/server/method/user/detail';
import { cache } from 'react';

export const getUserDetail = cache(
  async (uid: number): Promise<UserDetailResponse> => {
    return await ServerApis.User.getUserDetail(uid);
  }
);
