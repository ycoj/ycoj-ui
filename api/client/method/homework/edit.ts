import { clientRequest } from '@/api/client';
import type {
  CreateHomeworkRequest,
  CreateHomeworkResponse,
} from '@/api/client/method/homework/create';
import type { Errorable } from '@/shared/types/error';

export type EditHomeworkRequest = CreateHomeworkRequest;
export type EditHomeworkResponse = CreateHomeworkResponse;
export type DeleteHomeworkResponse = { url?: string };

export const editHomework = (tid: string, payload: EditHomeworkRequest) =>
  clientRequest.Post<EditHomeworkResponse>(`/homework/${tid}/edit`, payload);

export const deleteHomework = (tid: string) =>
  clientRequest.Post<Errorable<DeleteHomeworkResponse>>(
    `/homework/${tid}/edit`,
    {
      operation: 'delete',
    }
  );
