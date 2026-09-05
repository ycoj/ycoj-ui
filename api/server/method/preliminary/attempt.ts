import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type {
  PreliminaryAnswers,
  PreliminaryQuestion,
  PreliminarySection,
} from '@/shared/types/preliminary';
import type { ObjectId } from '@/shared/types/shared';

export type PreliminaryQuestionResult = {
  questionId: string;
  answer?: string;
  correct: boolean;
  score: number;
  maxScore: number;
};

export type PreliminaryReviewQuestion = Pick<
  PreliminaryQuestion,
  'id' | 'type' | 'prompt' | 'score' | 'options' | 'questionNumber'
> & {
  result: PreliminaryQuestionResult;
  correctAnswer?: string;
  explanation?: string;
};

export type PreliminaryReviewSection = Pick<
  PreliminarySection,
  'id' | 'type' | 'title' | 'content'
> & {
  questions: PreliminaryReviewQuestion[];
};

export type PreliminaryReviewPaper = {
  docId: ObjectId;
  title: string;
  content: string;
  revision: number;
  sections: PreliminaryReviewSection[];
};

export type PreliminaryAttemptDoc = {
  docId: ObjectId;
  paperId: ObjectId;
  parentId: ObjectId;
  parentType: number;
  revisionId: ObjectId;
  revision: number;
  owner: number;
  answers: PreliminaryAnswers;
  results: PreliminaryQuestionResult[];
  score: number;
  totalScore: number;
  submittedAt: string;
};

export type PreliminaryAttemptData = {
  attempt: PreliminaryAttemptDoc;
  paper: PreliminaryReviewPaper;
};

export type PreliminaryAttemptResponse = Errorable<PreliminaryAttemptData>;

export const getPreliminaryAttempt = (paperId: string, attemptId: string) =>
  alova.Get<PreliminaryAttemptResponse>(
    `/preliminary/${paperId}/attempt/${attemptId}`
  );
