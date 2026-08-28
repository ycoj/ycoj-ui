import { getUsersByIds, searchUsers } from './auto-complete';
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

  it('resolves selected users by UID', () => {
    const request = getUsersByIds('school/a', ['7', '12']);

    expect(request.url).toBe('/d/school%2Fa/api/users');
    expect(request.data).toEqual({
      args: { auto: ['7', '12'] },
      projection: ['_id', 'uname', 'displayName', 'avatarUrl'],
    });
  });
});
