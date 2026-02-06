import { alova } from '@/api/server';
import type { ProblemDoc, SolutionDoc } from '@/shared/types/problem';
import type { ObjectId } from '@/shared/types/shared';
import type { BaseUserDict } from '@/shared/types/user';

export type ProblemSolutionResponse = {
  psdocs: SolutionDoc[];
  page: number;
  pcount: number;
  pscount: number;
  udict: BaseUserDict;
  pssdict: Record<string, { docId: ObjectId; vote: number }>;
  pdoc: ProblemDoc;
  sid?: string;
};

export const getProblemSolution = (
  pid: string | number,
  params?: {
    page?: number;
    sid?: string;
  }
) =>
  alova.Get<ProblemSolutionResponse>(`/p/${pid}/solution`, {
    params,
  });
