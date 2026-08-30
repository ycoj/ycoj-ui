import { clientRequest } from '@/api/client';
import type { ObjectId } from '@/shared/types/shared';

export type CreateTrainingRequest = {
  title: string;
  content: string;
  description: string;
  dag: string;
  pin: number;
};

export type CreateTrainingResponse = {
  tid: ObjectId;
  url?: string;
};

export const createTraining = (payload: CreateTrainingRequest) =>
  clientRequest.Post<CreateTrainingResponse>('/training/create', payload);
