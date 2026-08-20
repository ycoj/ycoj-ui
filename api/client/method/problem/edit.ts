import { clientRequest } from '@/api/client';

export type EditProblemRequest = {
  pid?: string;
  title: string;
  content: string;
  tag?: string;
  difficulty?: number;
  hidden?: boolean;
};

export type EditProblemResponse = {
  url?: string;
};

export const editProblem = (pid: string, payload: EditProblemRequest) =>
  clientRequest.Post<EditProblemResponse>(`/p/${pid}/edit`, payload);
