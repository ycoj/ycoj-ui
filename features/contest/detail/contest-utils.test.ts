import {
  canShowContestScoreboard,
  getContestDurationParts,
  getContestProblemLabel,
  getContestStatus,
} from './contest-utils';
import type { ContestDetailTdoc } from '@/api/server/method/contests/detail';
import { PERM } from '@/features/user/lib/priv';
import type { User } from '@/shared/types/user';
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

describe('getContestProblemLabel', () => {
  it.each([
    [0, 'A'],
    [25, 'Z'],
    [26, 'AA'],
    [27, 'AB'],
    [51, 'AZ'],
    [52, 'BA'],
  ])('formats index %s as %s', (index, expected) => {
    expect(getContestProblemLabel(index)).toBe(expected);
  });

  it('returns an empty label for invalid indexes', () => {
    expect(getContestProblemLabel(-1)).toBe('');
    expect(getContestProblemLabel(1.5)).toBe('');
  });
});

describe('getContestDurationParts', () => {
  it('returns null for invalid or non-positive ranges', () => {
    expect(
      getContestDurationParts('bad', '2024-01-01T00:00:00.000Z')
    ).toBeNull();
    expect(
      getContestDurationParts(
        '2024-01-01T12:00:00.000Z',
        '2024-01-01T10:00:00.000Z'
      )
    ).toBeNull();
    expect(
      getContestDurationParts(
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T10:00:00.000Z'
      )
    ).toBeNull();
  });

  it('formats minutes only', () => {
    expect(
      getContestDurationParts(
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T10:45:00.000Z'
      )
    ).toEqual({ days: 0, hours: 0, minutes: 45 });
  });

  it('formats hours and optional minutes', () => {
    expect(
      getContestDurationParts(
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T12:00:00.000Z'
      )
    ).toEqual({ days: 0, hours: 2, minutes: 0 });
    expect(
      getContestDurationParts(
        '2024-01-01T10:00:00.000Z',
        '2024-01-01T12:30:00.000Z'
      )
    ).toEqual({ days: 0, hours: 2, minutes: 30 });
  });

  it('formats days and optional hours', () => {
    expect(
      getContestDurationParts(
        '2024-01-01T00:00:00.000Z',
        '2024-01-03T00:00:00.000Z'
      )
    ).toEqual({ days: 2, hours: 0, minutes: 0 });
    expect(
      getContestDurationParts(
        '2024-01-01T00:00:00.000Z',
        '2024-01-03T05:00:00.000Z'
      )
    ).toEqual({ days: 2, hours: 5, minutes: 0 });
  });
});

describe('canShowContestScoreboard', () => {
  function makeUser(overrides: Partial<User> = {}): User {
    return {
      _id: 1,
      uname: 'tester',
      mail: 'tester@example.com',
      avatar: '',
      perm: 'BigInt::0',
      role: 'default',
      priv: 0,
      regat: '2020-01-01T00:00:00.000Z',
      loginat: '2020-01-01T00:00:00.000Z',
      tfa: false,
      authn: false,
      ...overrides,
    };
  }

  function makeContestWithRule(
    rule: ContestDetailTdoc['rule'],
    owner = 100
  ): ContestDetailTdoc {
    return {
      rule,
      owner,
      beginAt: new Date('2099-01-01T10:00:00.000Z'),
      endAt: new Date('2099-01-01T12:00:00.000Z'),
    } as ContestDetailTdoc;
  }

  it('shows the scoreboard for non-OI rules without extra permissions', () => {
    expect(
      canShowContestScoreboard(makeContestWithRule('acm'), makeUser())
    ).toBe(true);
    expect(
      canShowContestScoreboard(makeContestWithRule('ioi'), makeUser())
    ).toBe(true);
  });

  it('hides the scoreboard for OI contests without the hidden-scoreboard permission', () => {
    expect(
      canShowContestScoreboard(makeContestWithRule('oi'), makeUser())
    ).toBe(false);
  });

  it('shows the scoreboard for OI contests with the hidden-scoreboard permission', () => {
    const user = makeUser({
      perm: `BigInt::${PERM.PERM_VIEW_CONTEST_HIDDEN_SCOREBOARD.toString()}`,
    });
    expect(
      canShowContestScoreboard(
        makeContestWithRule('oi'),
        user,
        dayjs('2099-01-01T11:00:00.000Z')
      )
    ).toBe(true);
  });

  it('shows the scoreboard to the contest owner for OI contests', () => {
    const user = makeUser({ _id: 100 });
    expect(
      canShowContestScoreboard(
        makeContestWithRule('oi', 100),
        user,
        dayjs('2099-01-01T11:00:00.000Z')
      )
    ).toBe(true);
  });

  it('does not treat the regular scoreboard permission as the hidden one', () => {
    const user = makeUser({
      perm: `BigInt::${PERM.PERM_VIEW_CONTEST_SCOREBOARD.toString()}`,
    });
    expect(
      canShowContestScoreboard(
        makeContestWithRule('oi'),
        user,
        dayjs('2099-01-01T11:00:00.000Z')
      )
    ).toBe(false);
  });

  it('shows the scoreboard to all users after an OI contest ends', () => {
    expect(
      canShowContestScoreboard(
        makeContestWithRule('oi'),
        makeUser(),
        dayjs('2099-01-01T12:00:00.000Z')
      )
    ).toBe(true);
  });
});
