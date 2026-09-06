import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';
import type { ObjectId } from '@/shared/types/shared';

export type ProblemSolutionDeleteResponse = Record<string, never>;

export const deleteProblemSolution = (pid: number | string, psid: ObjectId) =>
  clientRequest.Post<Errorable<ProblemSolutionDeleteResponse>>(
    `/p/${pid}/solution`,
    {
      psid,
      operation: 'delete_solution',
    }
  );
