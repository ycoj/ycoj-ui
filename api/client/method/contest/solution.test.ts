import { deleteContestSolution, saveContestSolution } from './solution';
import { describe, expect, it } from 'vitest';

describe('contest solution mutations', () => {
  it('deletes through the detail handler without invoking edit validation', () => {
    const request = deleteContestSolution('contest', 'solution');

    expect(request.url).toBe('/contest/contest/solution/solution');
    expect(request.data).toEqual({ operation: 'delete' });
  });

  it('keeps updates on the edit handler with title and content', () => {
    const payload = { title: 'Editorial', content: 'Answer' };
    const request = saveContestSolution('contest', payload, 'solution');

    expect(request.url).toBe('/contest/contest/solution/solution/edit');
    expect(request.data).toEqual(payload);
  });
});
