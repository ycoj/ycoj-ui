import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type {
  ProblemDict,
  SolutionDoc,
  SolutionReviewLabels,
} from '@/shared/types/problem';
import type { BaseUserDict } from '@/shared/types/user';

/** Filters accepted by `ProblemSolutionReviewHandler.get`. */
export const SOLUTION_REVIEW_STATUSES = [
  'pending',
  'featured',
  'approved',
  'rejected',
  'blocked',
  'all',
] as const;

export type SolutionReviewStatusFilter =
  (typeof SOLUTION_REVIEW_STATUSES)[number];

/** The status filters plus the blocked-author view. */
export type SolutionReviewFilter = SolutionReviewStatusFilter | 'authors';

const isStatusFilter = (
  value: string | undefined
): value is SolutionReviewStatusFilter =>
  value !== undefined &&
  (SOLUTION_REVIEW_STATUSES as readonly string[]).includes(value);

/** Unknown or missing `status` values fall back to the pending queue. */
export const parseSolutionReviewFilter = (
  value?: string
): SolutionReviewFilter =>
  value === 'authors' ? 'authors' : isStatusFilter(value) ? value : 'pending';

export type BlockedSolutionAuthor = {
  domainId: string;
  uid: number;
  solutionBlocked: boolean;
  solutionBlockedBy?: number;
  solutionBlockedAt?: string;
};

type ReviewOverview = {
  page: number;
  pcount: number;
  count: number;
  pid?: number;
  uid?: number;
  stats: { totalSolutions: number; newToday: number; pendingReview: number };
  udict: BaseUserDict;
  pdict: ProblemDict;
  reviewLabels: SolutionReviewLabels;
};

/** A claimed solution; `claimReview` holds a 60-second review lease on it. */
export type ClaimedSolution = SolutionDoc & { reviewLockUntil: string };

export type SolutionReviewData = ReviewOverview &
  (
    | { status: SolutionReviewStatusFilter; docs: ClaimedSolution[] }
    | { status: 'authors'; docs: BlockedSolutionAuthor[] }
  );

export const getSolutionReview = (status: SolutionReviewFilter = 'pending') =>
  alova.Get<Errorable<SolutionReviewData>>('/p/solution-review', {
    params: { status },
    cacheFor: 0,
  });
