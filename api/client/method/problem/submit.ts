import { clientRequest } from '@/api/client';
import { ObjectId } from '@/shared/types/shared';

export type ProblemSubmitRequest = {
  lang: string;
  code?: string;
  pretest?: boolean;
  input?: string[];
  tid?: ObjectId;
};

export type ProblemSubmitResponse = {
  rid?: ObjectId;
  tid?: ObjectId;
};

export const SubmitProblem = (pid: string, payload: ProblemSubmitRequest) =>
  clientRequest.Post<ProblemSubmitResponse>(`/p/${pid}/submit`, payload);
