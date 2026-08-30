import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';

export type DeleteTrainingRequest = {
  operation: 'delete';
};

export type DeleteTrainingResponse = {
  url: string;
};

export const deleteTraining = (tid: string, payload: DeleteTrainingRequest) =>
  clientRequest.Post<Errorable<DeleteTrainingResponse>>(
    `/training/${tid}`,
    payload
  );
