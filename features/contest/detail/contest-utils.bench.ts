import { getContestStatus } from './contest-utils';
import type { ContestDetailTdoc } from '@/api/server/method/contests/detail';
import dayjs from 'dayjs';
import { bench, describe } from 'vitest';

const contest = {
  beginAt: '2024-01-01T10:00:00.000Z' as unknown as Date,
  endAt: '2024-01-02T12:30:00.000Z' as unknown as Date,
} as ContestDetailTdoc;

const now = dayjs('2024-01-01T11:00:00.000Z');

// Keeps results reachable so the engine cannot drop the calls entirely.
const sink: { value: unknown } = { value: undefined };

describe('contest utils', () => {
  bench('getContestStatus - contest list', () => {
    let running = 0;
    for (let index = 0; index < 100; index += 1) {
      if (getContestStatus(contest, now) === 'running') running += 1;
    }
    sink.value = running;
  });
});
