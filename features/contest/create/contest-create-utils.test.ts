import {
  buildCreateContestPayload,
  getContestCreateDefaults,
} from '@/features/contest/create/contest-create-utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { describe, expect, it } from 'vitest';

dayjs.extend(utc);

describe('contest create utilities', () => {
  it('rounds the default start to the next quarter hour in the user timezone', () => {
    const now = dayjs.utc('2026-08-28T02:07:00Z');
    const defaults = getContestCreateDefaults('Asia/Shanghai', now);

    expect(defaults.beginAtDate).toBe('2026-08-28');
    expect(defaults.beginAtTime).toBe('10:15');
    expect(defaults.duration).toBe('2');
    expect(defaults.rated).toBe(true);
    expect(defaults.maintainer).toEqual([]);
    expect(getContestCreateDefaults(undefined, now)).toEqual(defaults);
  });

  it('normalizes lists and only sends settings supported by the selected rule', () => {
    const payload = buildCreateContestPayload({
      ...getContestCreateDefaults('Asia/Shanghai'),
      rule: 'oi',
      title: '  Summer Contest  ',
      content: '  Welcome  ',
      pids: [
        { docId: 1000, title: 'A' },
        { docId: 1001, title: 'B' },
        { docId: 1002, title: 'C' },
      ],
      maintainer: ['2', '8'],
      permission: 'assign',
      assign: ['class-a', 'class-b'],
      code: 'unused',
      langs: ['cc.cc17', 'python.py3'],
      lock: '30',
      contestDuration: '3.5',
      keepScoreboardHidden: true,
    });

    expect(payload).toMatchObject({
      operation: 'update',
      title: 'Summer Contest',
      content: 'Welcome',
      pids: '1000,1001,1002',
      maintainer: [2, 8],
      assign: ['class-a', 'class-b'],
      code: '',
      langs: ['cc.cc17', 'python.py3'],
      lock: undefined,
      contestDuration: 3.5,
      keepScoreboardHidden: true,
    });
  });

  it('omits assignments unless assigned access is selected', () => {
    const payload = buildCreateContestPayload({
      ...getContestCreateDefaults('Asia/Shanghai'),
      title: 'Public contest',
      content: 'Welcome',
      pids: [{ docId: 1000, title: 'A' }],
      permission: 'public',
      assign: ['class-a', '7'],
    });

    expect(payload.assign).toEqual([]);
    expect(payload.maintainer).toEqual([]);
  });

  it('omits blank lock and duration values instead of sending zero', () => {
    const payload = buildCreateContestPayload({
      ...getContestCreateDefaults('Asia/Shanghai'),
      rule: 'ioi',
      title: 'IOI contest',
      content: 'Welcome',
      pids: [{ docId: 1000, title: 'A' }],
      lock: '  ',
      contestDuration: '  ',
    });

    expect(payload.lock).toBeUndefined();
    expect(payload.contestDuration).toBeUndefined();
  });
});
