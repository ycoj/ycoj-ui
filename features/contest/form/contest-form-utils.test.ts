import type { ContestEditData } from '@/api/server/method/contests/edit';
import {
  buildCreateContestPayload,
  contestPermissionFromTdoc,
  formatHours,
  getContestCreateDefaults,
  mapContestEditToFormValues,
  resolveContestAutoHide,
} from '@/features/contest/form/contest-form-utils';
import type { Contest } from '@/shared/types/contest';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { describe, expect, it } from 'vitest';

dayjs.extend(utc);

function makeTdoc(overrides: Partial<Contest> = {}): Contest {
  return {
    _id: 'id',
    docId: 'tid',
    docType: 30,
    domainId: 'system',
    owner: 1,
    maintainer: [2],
    beginAt: new Date('2026-08-29T02:00:00.000Z'),
    endAt: new Date('2026-08-29T06:00:00.000Z'),
    attend: 0,
    title: 'Summer Contest',
    content: 'Welcome',
    rule: 'acm',
    pids: [1000, 1001],
    rated: true,
    duration: 0,
    ...overrides,
  };
}

function makeEditData(
  overrides: Partial<ContestEditData> = {},
  tdocOverrides: Partial<Contest> = {}
): ContestEditData {
  return {
    tdoc: makeTdoc(tdocOverrides),
    duration: 4,
    pids: '1000,1001',
    page_name: 'contest_edit',
    ...overrides,
  };
}

describe('contest form utilities', () => {
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

  it('rounds wall-clock hours to two decimal places', () => {
    expect(formatHours(4)).toBe('4');
    expect(formatHours(3.5)).toBe('3.5');
    expect(formatHours(1.999)).toBe('2');
  });

  it('keeps the stored auto-hide flag when the editor cannot change it', () => {
    expect(resolveContestAutoHide(true, true, false)).toBe(true);
    expect(resolveContestAutoHide(true, false, true)).toBe(false);
    expect(resolveContestAutoHide(false, false, true)).toBe(true);
    expect(resolveContestAutoHide(false, true, false)).toBe(false);
  });

  it('derives participation access from assign and invitation code', () => {
    expect(contestPermissionFromTdoc({ assign: ['class-a'] })).toBe('assign');
    expect(contestPermissionFromTdoc({ _code: 'secret' })).toBe('invite');
    expect(contestPermissionFromTdoc({})).toBe('public');
  });

  it('maps edit GET data into form values without using create defaults', () => {
    const values = mapContestEditToFormValues(
      makeEditData(
        {},
        {
          _code: 'secret',
          allowViewCode: false,
          allowPrint: true,
          autoHide: true,
          rated: false,
          lockAt: new Date('2026-08-29T05:00:00.000Z'),
        }
      ),
      [
        { docId: 1000, title: 'A' },
        { docId: 1001, pid: 'P1001', title: 'B' },
      ],
      'Asia/Shanghai'
    );

    expect(values).toMatchObject({
      rule: 'acm',
      title: 'Summer Contest',
      beginAtDate: '2026-08-29',
      beginAtTime: '10:00',
      duration: '4',
      permission: 'invite',
      code: 'secret',
      rated: false,
      autoHide: true,
      allowViewCode: false,
      allowPrint: true,
      lock: '60',
      contestDuration: '',
      maintainer: ['2'],
    });
    expect(values.pids).toEqual([
      { docId: 1000, title: 'A' },
      { docId: 1001, pid: 'P1001', title: 'B' },
    ]);
  });

  it('prefers assigned access over an invitation code and maps flexible duration', () => {
    const values = mapContestEditToFormValues(
      makeEditData(
        { duration: 5 },
        {
          rule: 'oi',
          assign: ['class-a'],
          _code: 'secret',
          duration: 3.5,
          keepScoreboardHidden: true,
        }
      ),
      [{ docId: 1000, title: 'A' }],
      'Asia/Shanghai'
    );

    expect(values.permission).toBe('assign');
    expect(values.assign).toEqual(['class-a']);
    expect(values.contestDuration).toBe('3.5');
    expect(values.keepScoreboardHidden).toBe(true);
  });
});
