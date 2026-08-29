import { clientRequest } from '@/api/client';

export type DeleteTrainingRequest = {
  operation: 'delete';
};

export type DeleteTrainingResponse = {
  url: string;
};

export const deleteTraining = (tid: string, payload: DeleteTrainingRequest) =>
  clientRequest.Post<DeleteTrainingResponse>(`/training/${tid}`, payload);
