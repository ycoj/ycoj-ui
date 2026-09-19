import { clientRequest } from '@/api/client';
import type {
  PreliminaryAnswers,
  PreliminaryProgrammingAnswers,
} from '@/shared/types/preliminary';
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
  answers: PreliminaryAnswers,
  programmingAnswers: PreliminaryProgrammingAnswers = {}
) =>
  clientRequest.Post<SubmitPreliminaryResponse>(`/preliminary/${paperId}`, {
    operation: 'submit',
    revision,
    answers,
    programmingAnswers,
  });
