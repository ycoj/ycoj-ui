import { clientRequest } from '@/api/client';

export type TrainingEnrollRequest = {
  operation: 'enroll';
};

export type TrainingEnrollResponse = Record<string, never>;

export const enrollTraining = (tid: string, payload: TrainingEnrollRequest) =>
  clientRequest.Post<TrainingEnrollResponse>(`/training/${tid}`, payload);
