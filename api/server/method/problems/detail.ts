import { alova } from '@/api/server';
import type { Contest, ContestStatus } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import type {
  ProblemStatus,
  PublicProjectionProblem,
} from '@/shared/types/problem';
import type { RecordDoc } from '@/shared/types/record';
import type { User } from '@/shared/types/user';

export type ProblemDetailResponse = {
  pdoc: PublicProjectionProblem;
  udoc: User;

  psdoc?: ProblemStatus;

  solutionCount: number;
  discussionCount: number;

  tdoc?: Contest;
  tsdoc?: ContestStatus;

  rdoc?: RecordDoc;

  ctdocs?: Array<Contest>;
  htdocs?: Array<Homework>;
};

export const getProblemDetail = (pid: string, tid?: string) =>
  alova.Get<ProblemDetailResponse>(`/p/${pid}`, {
    params: tid ? { tid } : {},
  });
