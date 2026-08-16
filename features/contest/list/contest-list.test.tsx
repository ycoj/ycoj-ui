import { groupContestsByStatus } from '@/features/contest/list/contest-list';
import type { ContestListProjection } from '@/shared/types/contest';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

function makeContest(
  docId: string,
  beginAt: Date,
  endAt: Date
): ContestListProjection {
  return {
    _id: docId,
    domainId: 'system',
    docId,
    title: docId,
    content: '',
    owner: 1,
    rule: 'acm',
    beginAt,
    endAt,
    pids: [],
    assign: [],
    maintainer: [],
    attend: 0,
  };
}

describe('groupContestsByStatus', () => {
  const now = dayjs('2026-01-10T12:00:00Z');

  it('groups contests into running, pending and ended', () => {
    const running = makeContest(
      'running',
      new Date('2026-01-10T10:00:00Z'),
      new Date('2026-01-10T14:00:00Z')
    );
    const pending = makeContest(
      'pending',
      new Date('2026-01-11T10:00:00Z'),
      new Date('2026-01-11T14:00:00Z')
    );
    const ended = makeContest(
      'ended',
      new Date('2026-01-09T10:00:00Z'),
      new Date('2026-01-09T14:00:00Z')
    );

    const groups = groupContestsByStatus([ended, pending, running], now);

    expect(groups.running).toEqual([running]);
    expect(groups.pending).toEqual([pending]);
    expect(groups.ended).toEqual([ended]);
  });

  it('preserves the original order within each group', () => {
    const first = makeContest(
      'first',
      new Date('2026-01-10T10:00:00Z'),
      new Date('2026-01-10T14:00:00Z')
    );
    const second = makeContest(
      'second',
      new Date('2026-01-10T11:00:00Z'),
      new Date('2026-01-10T15:00:00Z')
    );

    const groups = groupContestsByStatus([second, first], now);

    expect(groups.running).toEqual([second, first]);
  });

  it('treats contests with invalid dates as ended', () => {
    const invalid = makeContest(
      'invalid',
      new Date('not-a-date'),
      new Date('also-not-a-date')
    );

    const groups = groupContestsByStatus([invalid], now);

    expect(groups.ended).toEqual([invalid]);
    expect(groups.running).toEqual([]);
    expect(groups.pending).toEqual([]);
  });
});
