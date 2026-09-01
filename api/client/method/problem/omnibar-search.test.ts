import { searchOmnibarProblems } from './omnibar-search';
import { describe, expect, it } from 'vitest';

describe('searchOmnibarProblems', () => {
  it('requests the default-domain problem list with a 10-item cap', () => {
    const request = searchOmnibarProblems('binary tree');

    expect(request.url).toBe('/d/system/p');
    expect(request.config.params).toEqual({
      q: 'binary tree',
      limit: 10,
    });
  });
});
