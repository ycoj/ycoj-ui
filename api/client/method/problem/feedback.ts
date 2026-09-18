import { clientRequest } from '@/api/client';
import type {
  ProblemFeedback,
  ProblemFeedbackStatus,
} from '@/shared/types/problem-feedback';

export const submitProblemFeedback = (
  pid: string | number,
  content: string,
  tid?: string
) =>
  clientRequest.Post<{ feedback: ProblemFeedback }>(
    `/p/${pid}/feedback`,
    { content },
    { params: { ...(tid ? { tid } : {}) } }
  );

export const updateProblemFeedbackStatus = (
  id: string,
  status: ProblemFeedbackStatus
) =>
  clientRequest.Post<{ feedback: ProblemFeedback; url: string }>(
    '/manage/problem-feedback',
    { operation: 'update_status', id, status }
  );
