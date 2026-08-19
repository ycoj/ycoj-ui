import {
  formatContestCountdown,
  getContestTimerState,
} from '@/features/contest/contest-timer-utils';
import { describe, expect, it } from 'vitest';

const beginAt = '2026-01-01T10:00:00.000Z';
const endAt = '2026-01-01T11:00:00.000Z';

describe('getContestTimerState', () => {
  it('calculates progress and remaining time for a running contest', () => {
    const state = getContestTimerState(
      { beginAt, endAt },
      null,
      '2026-01-01T10:15:30.000Z'
    );

    expect(state?.progress).toBeCloseTo(0.2583, 3);
    expect(state?.remainingSeconds).toBe(2670);
  });

  it('uses participant times for flexible contests', () => {
    const state = getContestTimerState(
      { beginAt, endAt, duration: 2 },
      {
        startAt: '2026-01-01T12:00:00.000Z',
        endAt: '2026-01-01T14:00:00.000Z',
      },
      '2026-01-01T13:00:00.000Z'
    );

    expect(state?.progress).toBe(0.5);
    expect(state?.remainingSeconds).toBe(3600);
  });

  it.each([
    '2026-01-01T09:59:59.000Z',
    '2026-01-01T11:00:00.000Z',
    'not-a-date',
  ])('returns null outside a valid active window: %s', (now) => {
    expect(getContestTimerState({ beginAt, endAt }, null, now)).toBeNull();
  });

  it('rejects zero-length windows', () => {
    expect(
      getContestTimerState({ beginAt, endAt: beginAt }, null, beginAt)
    ).toBeNull();
  });
});

describe('formatContestCountdown', () => {
  it('formats hours, minutes, and seconds', () => {
    expect(formatContestCountdown(3661)).toBe('01:01:01');
  });

  it('prefixes durations longer than one day', () => {
    expect(formatContestCountdown(90061)).toBe('1d 01:01:01');
  });
});
