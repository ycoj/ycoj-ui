import { canEditProblem } from './can-edit-problem';
import { PERM } from '@/features/user/lib/priv';
import type { User } from '@/shared/types/user';
import { describe, expect, it } from 'vitest';

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

function perm(...perms: bigint[]): string {
  let value = BigInt(0);
  for (const p of perms) value |= p;
  return `BigInt::${value.toString()}`;
}

describe('canEditProblem', () => {
  it('returns false for anonymous user', () => {
    const user = makeUser({ _id: 0, perm: perm(PERM.PERM_EDIT_PROBLEM) });
    expect(canEditProblem(user, { owner: 0 })).toBe(false);
  });

  it('returns false for reference problem', () => {
    const user = makeUser({ perm: perm(PERM.PERM_EDIT_PROBLEM) });
    expect(
      canEditProblem(user, {
        owner: 1,
        reference: { domainId: 'test', pid: 1 },
      })
    ).toBe(false);
  });

  it('returns false in contest mode (tid present)', () => {
    const user = makeUser({ perm: perm(PERM.PERM_EDIT_PROBLEM) });
    expect(canEditProblem(user, { owner: 1 }, { tid: 'tid123' })).toBe(false);
  });

  it('allows global editor regardless of ownership', () => {
    const user = makeUser({ _id: 2, perm: perm(PERM.PERM_EDIT_PROBLEM) });
    expect(canEditProblem(user, { owner: 1 })).toBe(true);
  });

  it('allows owner with self permission', () => {
    const user = makeUser({
      _id: 1,
      perm: perm(PERM.PERM_EDIT_PROBLEM_SELF),
    });
    expect(canEditProblem(user, { owner: 1 })).toBe(true);
  });

  it('denies owner without self permission', () => {
    const user = makeUser({ _id: 1, perm: perm(PERM.PERM_VIEW_PROBLEM) });
    expect(canEditProblem(user, { owner: 1 })).toBe(false);
  });

  it('denies non-owner without global permission even with self permission', () => {
    const user = makeUser({
      _id: 2,
      perm: perm(PERM.PERM_EDIT_PROBLEM_SELF),
    });
    expect(canEditProblem(user, { owner: 1 })).toBe(false);
  });

  it('denies user with no relevant permission', () => {
    const user = makeUser({ perm: perm(PERM.PERM_VIEW_PROBLEM) });
    expect(canEditProblem(user, { owner: 2 })).toBe(false);
  });

  it('allows when user has both permissions', () => {
    const user = makeUser({
      _id: 1,
      perm: perm(PERM.PERM_EDIT_PROBLEM, PERM.PERM_EDIT_PROBLEM_SELF),
    });
    expect(canEditProblem(user, { owner: 1 })).toBe(true);
  });
});
