import { searchUsers } from './auto-complete';
import { describe, expect, it } from 'vitest';

describe('searchUsers', () => {
  it('uses the users query with a focused projection', () => {
    const request = searchUsers('system', 'alice');

    expect(request.url).toBe('/d/system/api/users');
    expect(request.data).toEqual({
      args: { search: 'alice' },
      projection: ['_id', 'uname', 'displayName', 'avatarUrl'],
    });
  });
});
