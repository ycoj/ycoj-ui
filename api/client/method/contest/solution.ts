import { clientRequest } from '@/api/client';

export type ContestSolutionMutationResponse = { sid: string };

export const saveContestSolution = (
  tid: string,
  payload: { title: string; content: string },
  sid?: string
) =>
  clientRequest.Post<ContestSolutionMutationResponse>(
    sid
      ? `/contest/${tid}/solution/${sid}/edit`
      : `/contest/${tid}/solution/create`,
    payload
  );

export const deleteContestSolution = (tid: string, sid: string) =>
  clientRequest.Post<Record<string, never>>(
    `/contest/${tid}/solution/${sid}/edit`,
    { operation: 'delete' }
  );
