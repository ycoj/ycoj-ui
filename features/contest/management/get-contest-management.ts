'server-only';

import ServerApis from '@/api/server/method';
import { cache } from 'react';

export const getContestManagement = cache((tid: string) =>
  ServerApis.Contests.getContestManagement(tid)
);
export const getContestUsers = cache((tid: string) =>
  ServerApis.Contests.getContestUsers(tid)
);
export const getContestClarifications = cache((tid: string) =>
  ServerApis.Contests.getContestClarifications(tid)
);
export const getContestBalloons = cache((tid: string) =>
  ServerApis.Contests.getContestBalloons(tid, true)
);
export const getContestBulkSubmit = cache((tid: string) =>
  ServerApis.Contests.getContestBulkSubmit(tid)
);
