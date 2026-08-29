import { clientRequest } from '@/api/client';
import type {
  CreateHomeworkRequest,
  CreateHomeworkResponse,
} from '@/api/client/method/homework/create';

export type EditHomeworkRequest = CreateHomeworkRequest;
export type EditHomeworkResponse = CreateHomeworkResponse;

export const editHomework = (tid: string, payload: EditHomeworkRequest) =>
  clientRequest.Post<EditHomeworkResponse>(`/homework/${tid}/edit`, payload);
