import type { ObjectId } from './shared';

export type PreliminarySectionType =
  'single_choice' | 'program_reading' | 'program_completion';

export type PreliminaryQuestionType = 'choice' | 'true_false';

// Fixed answer literals for true/false questions, shared by the publish
// schema, the draft allow-list, and the option renderers.
export const PRELIMINARY_TRUE_FALSE_VALUES = ['true', 'false'] as const;

export type PreliminaryTrueFalseValue =
  (typeof PRELIMINARY_TRUE_FALSE_VALUES)[number];

export type PreliminaryChoiceOption = {
  id: string;
  text: string;
};

export type PreliminaryQuestion = {
  id: string;
  type: PreliminaryQuestionType;
  prompt: string;
  score: number;
  explanation: string;
  answer: string;
  options?: PreliminaryChoiceOption[];
  questionNumber?: number;
};

export type PreliminarySection = {
  id: string;
  type: PreliminarySectionType;
  title: string;
  content: string;
  questions: PreliminaryQuestion[];
};

export type PreliminaryDefinition = {
  title: string;
  content: string;
  sections: PreliminarySection[];
};

export type PreliminaryQuestionInput = Omit<
  PreliminaryQuestion,
  'explanation'
> & {
  explanation?: string;
};

export type PreliminarySectionInput = Omit<PreliminarySection, 'questions'> & {
  questions: PreliminaryQuestionInput[];
};

export type PreliminaryDefinitionInput = {
  title: string;
  content: string;
  sections: PreliminarySectionInput[];
};

export type PreliminaryAnswers = Record<string, string>;

export type PreliminaryPaperSummary = {
  docId: ObjectId;
  owner: number;
  title: string;
  content: string;
  published: boolean;
  revision: number;
  nAttempt: number;
  updatedAt: string;
  questionCount: number;
  totalScore: number;
};

export type PreliminaryAttemptSummary = {
  docId: ObjectId;
  paperId: ObjectId;
  revision: number;
  title: string;
  score: number;
  totalScore: number;
  submittedAt: string;
};
