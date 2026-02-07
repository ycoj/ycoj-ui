import { clientRequest } from '@/api/client';
import type { ContestProblemsResponse } from '@/api/server/method/contests/problems';

export const getContestProblems = (tid: string) =>
  clientRequest.Get<ContestProblemsResponse>(`/contest/${tid}/problems`);
