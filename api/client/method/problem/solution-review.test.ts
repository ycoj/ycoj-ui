import {
  reviewProblemSolution,
  unblockSolutionAuthor,
} from './solution-review';
import { describe, expect, it } from 'vitest';

describe('solution review requests', () => {
  it.each([-1, 0, 2, 3] as const)(
    'preserves outcome %s and optimistic revision in the review contract',
    (status) => {
      const request = reviewProblemSolution('solution-id', 4, status);
      expect(request.url).toBe('/p/solution-review');
      expect(request.data).toEqual({
        operation: 'review',
        psid: 'solution-id',
        revision: 4,
        status,
      });
    }
  );

  it('unblocks by user ID without a solution or revision', () => {
    const request = unblockSolutionAuthor(42);
    expect(request.url).toBe('/p/solution-review');
    expect(request.data).toEqual({ operation: 'unblock', uid: 42 });
  });
});
