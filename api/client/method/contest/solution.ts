import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';

export type ContestSolutionMutationResponse = { sid: string };

export const saveContestSolution = (
  tid: string,
  payload: { title: string; content: string },
  sid?: string
) =>
  clientRequest.Post<Errorable<ContestSolutionMutationResponse>>(
    sid
      ? `/contest/${tid}/solution/${sid}/edit`
      : `/contest/${tid}/solution/create`,
    payload
  );

export const deleteContestSolution = (tid: string, sid: string) =>
  clientRequest.Post<Errorable<{ url?: string }>>(
    `/contest/${tid}/solution/${sid}/edit`,
    { operation: 'delete' }
  );
