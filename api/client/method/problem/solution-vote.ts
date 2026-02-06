import { clientRequest } from '@/api/client';

export type ProblemSolutionVoteOperation = 'upvote' | 'downvote';

export type ProblemSolutionVoteResponse = {
  vote: number;
  user_vote: 1 | -1;
};

export const voteSolution = (
  pid: string | number,
  sid: string,
  operation: ProblemSolutionVoteOperation
) =>
  clientRequest.Post<ProblemSolutionVoteResponse>(`/p/${pid}/solution`, {
    operation,
    psid: sid,
  });
