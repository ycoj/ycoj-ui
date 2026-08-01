import { clientRequest } from '@/api/client';

export type CreateProblemRequest = {
  pid?: string;
  title: string;
  content: string;
  tag?: string;
  difficulty?: number;
  hidden?: boolean;
};

export type CreateProblemResponse = {
  pid: string | number;
};

export const createProblem = (payload: CreateProblemRequest) =>
  clientRequest.Post<CreateProblemResponse>('/problem/create', payload);
