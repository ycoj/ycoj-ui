import {
  canShowContestSolutions,
  getContestSolutionDate,
  getVisibleContestSolutions,
} from './contest-solution-utils';
import type { ContestSolutionListItem } from '@/api/server/method/contests/solution';
import type { ContestRule } from '@/shared/types/contest';
import { describe, expect, it } from 'vitest';

const item = (docId: string): ContestSolutionListItem => ({
  docId,
  title: 'Editorial',
  owner: 1,
});

describe('canShowContestSolutions', () => {
  it.each([
    { rule: 'acm', show: true, expected: true },
    { rule: 'oi', show: true, expected: true },
    { rule: 'homework', show: true, expected: false },
    { rule: 'acm', show: false, expected: false },
    { rule: 'acm', show: undefined, expected: false },
    { rule: 'homework', show: undefined, expected: false },
  ] as { rule: ContestRule; show?: boolean; expected: boolean }[])(
    'rule=$rule show=$show -> $expected',
    ({ rule, show, expected }) => {
      expect(canShowContestSolutions(rule, show)).toBe(expected);
    }
  );
});

describe('getVisibleContestSolutions', () => {
  const cases: {
    name: string;
    csdocs: ContestSolutionListItem[] | undefined;
    canManage?: boolean;
    expected: ContestSolutionListItem[] | null;
  }[] = [
    {
      name: 'hides empty solutions from readers',
      csdocs: [],
      canManage: false,
      expected: null,
    },
    {
      name: 'hides missing solutions from readers',
      csdocs: undefined,
      canManage: undefined,
      expected: null,
    },
    {
      name: 'shows empty state to managers',
      csdocs: [],
      canManage: true,
      expected: [],
    },
    {
      name: 'shows published solutions to readers',
      csdocs: [item('65a1bc000000000000000000')],
      canManage: false,
      expected: [item('65a1bc000000000000000000')],
    },
  ];
  it.each(cases)('$name', ({ csdocs, canManage, expected }) => {
    expect(getVisibleContestSolutions(csdocs, canManage)).toEqual(expected);
  });
});

describe('getContestSolutionDate', () => {
  it.each([
    { docId: '65a1bc000000000000000000', valid: true },
    { docId: '000000000000000000000000', valid: true },
    { docId: 'ffffffffffffffffffffffff', valid: true },
  ])('parses ObjectId timestamp $docId', ({ docId, valid }) => {
    const date = getContestSolutionDate(docId);
    expect(date instanceof Date).toBe(valid);
  });

  it.each([[''], ['short'], ['zzzzzzzzzzzzzzzzzzzzzzzz'], ['65a1bc']])(
    'returns null for malformed id %s',
    (docId) => {
      expect(getContestSolutionDate(docId)).toBeNull();
    }
  );
});
