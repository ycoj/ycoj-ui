import { clientRequest } from '@/api/client';
import type { ObjectId } from '@/shared/types/shared';

export type ProblemSolutionReplyResponse = {
  psid: ObjectId;
};

export const replyProblemSolution = (
  pid: number,
  psid: ObjectId,
  content: string
) =>
  clientRequest.Post<ProblemSolutionReplyResponse>(`/p/${pid}/solution`, {
    psid,
    content,
  });
