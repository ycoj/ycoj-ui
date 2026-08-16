import { searchProblems } from './auto-complete';
import { describe, expect, it } from 'vitest';

describe('searchProblems', () => {
  it('uses the quick problem list endpoint for a query', () => {
    const request = searchProblems('system', 'binary tree');

    expect(request.url).toBe('/d/system/p');
    expect(request.config.params).toEqual({
      q: 'binary tree',
      quick: true,
      sort: 'default',
    });
  });

  it('requests recent problems for an empty query', () => {
    const request = searchProblems('system', '');

    expect(request.config.params).toEqual({
      q: '',
      quick: true,
      sort: 'recent',
    });
  });
});
