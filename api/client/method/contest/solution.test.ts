import {
  createContestSolution,
  deleteContestSolution,
  updateContestSolution,
} from './solution';
import { describe, expect, it } from 'vitest';

describe('contest solution mutations', () => {
  it('deletes through the detail handler without invoking edit validation', () => {
    const request = deleteContestSolution('contest', 'solution');

    expect(request.url).toBe('/contest/contest/solution/solution');
    expect(request.data).toEqual({ operation: 'delete' });
  });

  it('keeps updates on the edit handler with title and content', () => {
    const payload = { title: 'Editorial', content: 'Answer' };
    const request = updateContestSolution('contest', 'solution', payload);

    expect(request.url).toBe('/contest/contest/solution/solution/edit');
    expect(request.data).toEqual(payload);
  });

  it('creates through the create handler without a solution id', () => {
    const payload = { title: 'Editorial', content: 'Answer' };
    const request = createContestSolution('contest', payload);

    expect(request.url).toBe('/contest/contest/solution/create');
    expect(request.data).toEqual(payload);
  });
});
