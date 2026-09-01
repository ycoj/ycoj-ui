import {
  buildOmnibarHits,
  isApplePlatform,
  isOmnibarHotkey,
  lookupProblemStatus,
  nextHighlightIndex,
  problemHref,
  userHref,
} from './omnibar-utils';
import type { UserAutoCompleteItem } from '@/api/client/method/user/auto-complete';
import type { ListProjectionProblem } from '@/shared/types/problem';
import { describe, expect, it } from 'vitest';

const problem = (overrides: Partial<ListProjectionProblem> = {}) =>
  ({
    _id: 'p1',
    domainId: 'system',
    docType: 10,
    docId: 1,
    pid: 'P1',
    owner: 2,
    title: 'A + B',
    nSubmit: 10,
    nAccept: 4,
    tag: [],
    ...overrides,
  }) as ListProjectionProblem;

const user = (
  overrides: Partial<UserAutoCompleteItem> = {}
): UserAutoCompleteItem => ({
  _id: 7,
  uname: 'alice',
  ...overrides,
});

describe('isOmnibarHotkey', () => {
  it.each([
    [{ key: 'k', ctrlKey: true, metaKey: false }, true],
    [{ key: 'K', metaKey: true, ctrlKey: false }, true],
    [{ key: 'k', ctrlKey: true, metaKey: true }, true],
    [{ key: 'k', ctrlKey: false, metaKey: false }, false],
    [{ key: 'k', ctrlKey: true, metaKey: false, altKey: true }, false],
    [{ key: 'k', ctrlKey: true, metaKey: false, shiftKey: true }, false],
    [{ key: 'b', ctrlKey: true, metaKey: false }, false],
    [{ key: 'k', ctrlKey: true, metaKey: false, repeat: true }, false],
  ] as const)('maps %j to %s', (partial, expected) => {
    expect(
      isOmnibarHotkey({
        altKey: false,
        shiftKey: false,
        ...partial,
      })
    ).toBe(expected);
  });
});

describe('isApplePlatform', () => {
  it.each([
    ['MacIntel', true],
    ['iPhone', true],
    ['Win32', false],
    ['Linux x86_64', false],
    ['', false],
  ])('treats %j as apple=%s', (platform, expected) => {
    expect(isApplePlatform(platform)).toBe(expected);
  });
});

describe('buildOmnibarHits', () => {
  it('lists problems before users and builds local hrefs', () => {
    expect(problemHref({ docId: 12 })).toBe('/problem/12');
    expect(problemHref({ pid: 'P12', docId: 12 })).toBe('/problem/P12');
    expect(userHref({ _id: 7 })).toBe('/user/7');

    const hits = buildOmnibarHits(
      [problem({ docId: 3, pid: 'P3', title: 'Tree' })],
      [user({ _id: 9, uname: 'bob' })]
    );

    expect(hits).toEqual([
      {
        kind: 'problem',
        id: 'problem-system-3',
        href: '/problem/P3',
        problem: expect.objectContaining({ docId: 3, title: 'Tree' }),
      },
      {
        kind: 'user',
        id: 'user-9',
        href: '/user/9',
        user: expect.objectContaining({ _id: 9, uname: 'bob' }),
      },
    ]);
  });
});

describe('lookupProblemStatus', () => {
  it('reads status keyed by numeric docId as a string', () => {
    const status = {
      _id: 'a'.repeat(24),
      docId: 3,
      docType: 10 as const,
      domainId: 'system',
      rid: 'b'.repeat(24),
      status: 1,
    };

    expect(lookupProblemStatus({ 3: status }, 3)).toBe(status);
    expect(lookupProblemStatus({}, 3)).toBeUndefined();
  });
});

describe('nextHighlightIndex', () => {
  it.each([
    [0, 3, 1, 1],
    [2, 3, 1, 0],
    [0, 3, -1, 2],
    [-1, 3, 1, 0],
    [-1, 3, -1, 2],
    [0, 0, 1, -1],
  ] as const)(
    'from %s of %s moving %s lands on %s',
    (current, length, direction, expected) => {
      expect(nextHighlightIndex(current, length, direction)).toBe(expected);
    }
  );
});
