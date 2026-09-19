import type { ProblemDict } from './problem';
import type { BaseUserDict } from './user';

export const PROBLEM_FEEDBACK_STATUSES = [
  'pending',
  'processing',
  'resolved',
  'invalid',
] as const;

export type ProblemFeedbackStatus = (typeof PROBLEM_FEEDBACK_STATUSES)[number];
export type ProblemFeedbackFilterStatus = ProblemFeedbackStatus | 'all';

export type ProblemFeedback = {
  _id: string;
  domainId: string;
  pid: number;
  owner: number;
  content: string;
  status: ProblemFeedbackStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
};

export type ProblemFeedbackManageData = {
  page_name: 'manage_problem_feedback';
  docs: ProblemFeedback[];
  page: number;
  pcount: number;
  count: number;
  pdict: ProblemDict;
  udict: BaseUserDict;
  status: ProblemFeedbackFilterStatus;
};
