import { alova } from '@/api/server';
import type {
  ProblemFeedbackFilterStatus,
  ProblemFeedbackManageData,
} from '@/shared/types/problem-feedback';

export const getProblemFeedback = (
  page = 1,
  status: ProblemFeedbackFilterStatus = 'pending'
) =>
  alova.Get<ProblemFeedbackManageData>('/manage/problem-feedback', {
    params: { page, status },
  });
