import { clientRequest } from '@/api/client';
import type { ObjectId } from '@/shared/types/shared';

export type ProblemSolutionSubmitResponse = {
  psid: ObjectId;
};

export const submitProblemSolution = (pid: number, content: string) =>
  clientRequest.Post<ProblemSolutionSubmitResponse>(`/p/${pid}/solution`, {
    content,
    operation: 'submit',
  });
