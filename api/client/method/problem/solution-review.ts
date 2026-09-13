import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';
import type { SolutionDoc, SolutionReviewStatus } from '@/shared/types/problem';
import type { ObjectId } from '@/shared/types/shared';

export const reviewProblemSolution = (
  psid: ObjectId,
  revision: number,
  status: Exclude<SolutionReviewStatus, 1>
) =>
  clientRequest.Post<Errorable<{ psdoc: SolutionDoc }>>('/p/solution-review', {
    operation: 'review',
    psid,
    revision,
    status,
  });

export const unblockSolutionAuthor = (uid: number) =>
  clientRequest.Post<Errorable<Record<string, never>>>('/p/solution-review', {
    operation: 'unblock',
    uid,
  });
