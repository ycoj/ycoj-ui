import ServerApis from '@/api/server/method';
import { cache } from 'react';
import 'server-only';

export const getContestSolution = cache(
  async (tid: string, sid: string) =>
    await ServerApis.Contests.getContestSolution(tid, sid)
);
export const getContestSolutionEdit = cache(
  async (tid: string, sid?: string) =>
    await ServerApis.Contests.getContestSolutionEdit(tid, sid)
);
