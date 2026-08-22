import {
  getOwnedBalloonColors,
  getProblemBalloonColors,
} from '@/features/contest/scoreboard/scoreboard-table';
import type { ScoreboardRow } from '@/shared/types/contest';
import { describe, expect, it } from 'vitest';

describe('scoreboard balloons', () => {
  const header = [
    { type: 'rank', value: '#' },
    { type: 'user', value: 'User' },
    { type: 'problem', value: 'A' },
    { type: 'problem', value: 'B' },
  ] as ScoreboardRow;

  it('assigns a distinct ICPC balloon color to each problem', () => {
    const colors = getProblemBalloonColors(header);

    expect(colors.get(2)).toBe('#dc2626');
    expect(colors.get(3)).toBe('#2563eb');
  });

  it('collects the balloons won by a participant', () => {
    const row = [
      { type: 'rank', value: 1 },
      { type: 'user', value: 'alice', raw: 1 },
      { type: 'record', value: '+', first: true },
      { type: 'record', value: '+' },
    ] as ScoreboardRow;

    expect(getOwnedBalloonColors(row, getProblemBalloonColors(header))).toEqual(
      ['#dc2626']
    );
  });
});
