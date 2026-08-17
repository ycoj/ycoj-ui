import { alova } from '@/api/server';
import type { ObjectId } from '@/shared/types/shared';

export type ProblemSubmitRequest = {
  lang: string;
  code?: string;
  pretest?: boolean;
  input?: string[];
};

export type ProblemSubmitResponse = {
  rid?: ObjectId;
  tid?: ObjectId;
};

/**
 * Submits a solution for a problem.
 *
 * @param tid Contest identifier passed as a URL query parameter to resolve
 * the problem in a contest context.
 */
export const submitProblem = (
  pid: string,
  payload: ProblemSubmitRequest,
  tid?: ObjectId
) =>
  alova.Post<ProblemSubmitResponse>(`/p/${pid}/submit`, payload, {
    params: tid ? { tid } : {},
  });
