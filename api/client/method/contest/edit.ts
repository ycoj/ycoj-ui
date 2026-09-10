import { clientRequest } from '@/api/client';
import type {
  CreateContestRequest,
  CreateContestResponse,
} from '@/api/client/method/contest/create';
import type { Errorable } from '@/shared/types/error';

export type EditContestRequest = CreateContestRequest;
export type EditContestResponse = CreateContestResponse;
export type DeleteContestResponse = { url?: string };

export const editContest = (tid: string, payload: EditContestRequest) =>
  clientRequest.Post<EditContestResponse>(`/contest/${tid}/edit`, payload);

export const deleteContest = (tid: string) =>
  clientRequest.Post<Errorable<DeleteContestResponse>>(`/contest/${tid}/edit`, {
    operation: 'delete',
  });
