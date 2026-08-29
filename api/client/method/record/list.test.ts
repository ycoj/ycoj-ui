import { getFullRecordList } from './list';
import { describe, expect, it } from 'vitest';

describe('getFullRecordList', () => {
  it('requests the current user full-status history for a problem context', () => {
    const request = getFullRecordList({ pid: 12, tid: 'contest-id' });

    expect(request.url).toBe('/record');
    expect(request.config.params).toEqual({
      fullStatus: true,
      pid: 12,
      tid: 'contest-id',
    });
  });
});
