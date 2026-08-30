import { clientRequest } from '@/api/client';
import type {
  CreateContestRequest,
  CreateContestResponse,
} from '@/api/client/method/contest/create';

export type EditContestRequest = CreateContestRequest;
export type EditContestResponse = CreateContestResponse;

export const editContest = (tid: string, payload: EditContestRequest) =>
  clientRequest.Post<EditContestResponse>(`/contest/${tid}/edit`, payload);

export const deleteContest = (tid: string) =>
  clientRequest.Post<Record<string, never>>(`/contest/${tid}/edit`, {
    operation: 'delete',
  });
