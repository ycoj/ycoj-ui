import { clientRequest } from '@/api/client';
import type {
  CreateTrainingRequest,
  CreateTrainingResponse,
} from '@/api/client/method/training/create';

export type EditTrainingRequest = CreateTrainingRequest;
export type EditTrainingResponse = CreateTrainingResponse;

export const editTraining = (tid: string, payload: EditTrainingRequest) =>
  clientRequest.Post<EditTrainingResponse>(`/training/${tid}/edit`, payload);
