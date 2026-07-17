import { formatContestDuration, getContestStatus } from './contest-utils';
import type { ContestDetailTdoc } from '@/api/server/method/contests/detail';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

function makeContest(
  beginAt: string | Date,
  endAt: string | Date
): ContestDetailTdoc {
  return {
    beginAt: beginAt as Date,
    endAt: endAt as Date,
  } as ContestDetailTdoc;
}

describe('getContestStatus', () => {
  const beginAt = '2024-01-01T10:00:00.000Z';
  const endAt = '2024-01-01T12:00:00.000Z';
  const contest = makeContest(beginAt, endAt);

  it('returns pending before beginAt', () => {
    expect(getContestStatus(contest, dayjs('2024-01-01T09:59:59.000Z'))).toBe(
      'pending'
    );
  });

  it('returns running between beginAt and endAt', () => {
    expect(getContestStatus(contest, dayjs(beginAt))).toBe('running');
    expect(getContestStatus(contest, dayjs('2024-01-01T11:00:00.000Z'))).toBe(
      'running'
    );
  });

  it('returns ended at or after endAt', () => {
    expect(getContestStatus(contest, dayjs(endAt))).toBe('ended');
    expect(getContestStatus(contest, dayjs('2024-01-01T13:00:00.000Z'))).toBe(
      'ended'
    );
  });

  it('returns ended when dates are invalid', () => {
    expect(
      getContestStatus(makeContest('not-a-date', endAt), dayjs(beginAt))
    ).toBe('ended');
    expect(
      getContestStatus(makeContest(beginAt, 'not-a-date'), dayjs(beginAt))
    ).toBe('ended');
  });
});

describe('formatContestDuration', () => {
  it('returns empty string for invalid or non-positive ranges', () => {
    expect(formatContestDuration('bad', '2024-01-01T00:00:00.000Z')).toBe('');
    expect(
      formatContestDuration(
        '2024-01-01T12:00:00.000Z',
        '2024-01-01T10:00:00.000Z'
      )
    ).toBe('');
    expect(
      formatContestDuration(
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T10:00:00.000Z'
      )
    ).toBe('');
  });

  it('formats minutes only', () => {
    expect(
      formatContestDuration(
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T10:45:00.000Z'
      )
    ).toBe('45 分钟');
  });

  it('formats hours and optional minutes', () => {
    expect(
      formatContestDuration(
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T12:00:00.000Z'
      )
    ).toBe('2 小时');
    expect(
      formatContestDuration(
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T12:30:00.000Z'
      )
    ).toBe('2 小时 30 分钟');
  });

  it('formats days and optional hours', () => {
    expect(
      formatContestDuration(
        '2024-01-01T00:00:00.000Z',
        '2024-01-03T00:00:00.000Z'
      )
    ).toBe('2 天');
    expect(
      formatContestDuration(
        '2024-01-01T00:00:00.000Z',
        '2024-01-03T05:00:00.000Z'
      )
    ).toBe('2 天 5 小时');
  });
});
