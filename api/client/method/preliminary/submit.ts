import { clientRequest } from '@/api/client';
import type { ObjectId } from '@/shared/types/shared';

export type SubmitPreliminaryResponse = {
  attemptId: ObjectId;
  score: number;
  totalScore: number;
  url: string;
};

export const submitPreliminary = (
  paperId: string,
  revision: number,
  answers: Record<string, string>
) =>
  clientRequest.Post<SubmitPreliminaryResponse>(`/preliminary/${paperId}`, {
    operation: 'submit',
    revision,
    answers,
  });
