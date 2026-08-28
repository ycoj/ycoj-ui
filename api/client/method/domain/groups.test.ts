import { getGroupsByNames, searchGroups } from './groups';
import { describe, expect, it } from 'vitest';

describe('user group autocomplete APIs', () => {
  it('searches groups in the current domain', () => {
    const request = searchGroups('system', 'class');

    expect(request.url).toBe('/d/system/api/groups');
    expect(request.data).toEqual({
      args: { search: 'class' },
      projection: ['name', 'uids'],
    });
  });

  it('resolves selected groups by name', () => {
    const request = getGroupsByNames('school/a', ['Class A', 'Class B']);

    expect(request.url).toBe('/d/school%2Fa/api/groups');
    expect(request.data).toEqual({
      args: { names: ['Class A', 'Class B'] },
      projection: ['name', 'uids'],
    });
  });
});
