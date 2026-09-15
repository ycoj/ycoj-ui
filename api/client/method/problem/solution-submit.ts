import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';
import type { ObjectId } from '@/shared/types/shared';

export type ProblemSolutionSubmitResponse = {
  psid: ObjectId;
  /** The referer that the backend's `Handler#back()` echoes back. */
  url?: string;
};

export const submitProblemSolution = (pid: number, content: string) =>
  clientRequest.Post<Errorable<ProblemSolutionSubmitResponse>>(
    `/p/${pid}/solution`,
    {
      content,
      operation: 'submit',
    }
  );
