import {
  filterScoreboardRows,
  isRankedRow,
  normalizeScoreboardFilter,
  SCOREBOARD_FILTER_ALL,
  SCOREBOARD_FILTER_RANKED,
} from './scoreboard-filter';
import type { GDoc, ScoreboardRow } from '@/shared/types/contest';
import { describe, expect, it } from 'vitest';

const header: ScoreboardRow = [
  { type: 'rank', value: '#' },
  { type: 'user', value: 'User' },
];

const alice: ScoreboardRow = [
  { type: 'rank', value: 1 },
  { type: 'user', value: 'alice', raw: 1 },
];
const bob: ScoreboardRow = [
  { type: 'rank', value: 2 },
  { type: 'user', value: 'bob', raw: 2 },
];
const carol: ScoreboardRow = [
  { type: 'rank', value: 0 },
  { type: 'user', value: 'carol', raw: 3 },
];

const rows: ScoreboardRow[] = [header, alice, bob, carol];

const groups: GDoc[] = [
  { _id: 'g1', name: 'Alpha', uids: [1, 3] },
  { _id: 'g2', name: 'Empty', uids: [] },
];

function uids(result: ScoreboardRow[]): unknown[] {
  return result
    .slice(1)
    .map((row) => row.find((node) => node.type === 'user')?.raw);
}

describe('isRankedRow', () => {
  it.each<[string, ScoreboardRow, boolean]>([
    ['a numeric rank', alice, true],
    ['a "0" string rank', [{ type: 'rank', value: '0' }], false],
    ['a 0 number rank', [{ type: 'rank', value: 0 }], false],
    ['a missing rank', [{ type: 'user', value: 'alice', raw: 1 }], true],
  ])('treats %s as ranked or not', (_, row, expected) => {
    expect(isRankedRow(row)).toBe(expected);
  });
});

describe('normalizeScoreboardFilter', () => {
  it.each<[string, string | undefined, string]>([
    ['a known group', 'g1', 'g1'],
    ['the ranked filter', SCOREBOARD_FILTER_RANKED, SCOREBOARD_FILTER_RANKED],
    ['the all filter', SCOREBOARD_FILTER_ALL, SCOREBOARD_FILTER_ALL],
    ['an unknown group', 'missing', SCOREBOARD_FILTER_ALL],
    ['a missing value', undefined, SCOREBOARD_FILTER_ALL],
  ])('maps %s to the selectable value', (_, value, expected) => {
    expect(normalizeScoreboardFilter(value, groups)).toBe(expected);
  });
});

describe('filterScoreboardRows', () => {
  it('keeps every row for the all filter and unknown filters', () => {
    expect(filterScoreboardRows(rows, SCOREBOARD_FILTER_ALL, groups)).toBe(
      rows
    );
    expect(filterScoreboardRows(rows, 'missing', groups)).toBe(rows);
  });

  it('returns the input untouched when there are no rows', () => {
    expect(filterScoreboardRows([], SCOREBOARD_FILTER_RANKED, groups)).toEqual(
      []
    );
  });

  it('drops unranked participants for the ranked filter', () => {
    const result = filterScoreboardRows(rows, SCOREBOARD_FILTER_RANKED, groups);
    expect(result[0]).toBe(header);
    expect(uids(result)).toEqual([1, 2]);
  });

  it('keeps only members of the selected group', () => {
    const result = filterScoreboardRows(rows, 'g1', groups);
    expect(result[0]).toBe(header);
    expect(uids(result)).toEqual([1, 3]);
  });

  it('shows only the header for a group without members', () => {
    expect(filterScoreboardRows(rows, 'g2', groups)).toEqual([header]);
  });
});
