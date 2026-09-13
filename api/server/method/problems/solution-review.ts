import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type { ProblemDict, SolutionDoc } from '@/shared/types/problem';
import type { BaseUserDict } from '@/shared/types/user';

export type BlockedSolutionAuthor = {
  domainId: string;
  uid: number;
  solutionBlocked: boolean;
  solutionBlockedBy?: number;
  solutionBlockedAt?: string;
};

type ReviewOverview = {
  stats: { totalSolutions: number; newToday: number; pendingReview: number };
  udict: BaseUserDict;
  pdict: ProblemDict;
};

export type SolutionReviewData = ReviewOverview &
  (
    | { status: 'pending'; docs: (SolutionDoc & { reviewLockUntil: string })[] }
    | { status: 'authors'; docs: BlockedSolutionAuthor[] }
  );

export const getSolutionReview = (status: 'pending' | 'authors' = 'pending') =>
  alova.Get<Errorable<SolutionReviewData>>('/p/solution-review', {
    params: { status },
    cacheFor: 0,
  });
