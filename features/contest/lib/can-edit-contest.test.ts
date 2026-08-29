import { canEditContest } from './can-edit-contest';
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

describe('canEditContest', () => {
  it('returns false for anonymous user', () => {
    const user = makeUser({ _id: 0, perm: perm(PERM.PERM_EDIT_CONTEST) });
    expect(canEditContest(user, { owner: 0 })).toBe(false);
  });

  it('allows a global editor who does not own the contest', () => {
    const user = makeUser({ _id: 2, perm: perm(PERM.PERM_EDIT_CONTEST) });
    expect(canEditContest(user, { owner: 1 })).toBe(true);
  });

  it('allows the owner with self permission', () => {
    const user = makeUser({
      _id: 1,
      perm: perm(PERM.PERM_EDIT_CONTEST_SELF),
    });
    expect(canEditContest(user, { owner: 1 })).toBe(true);
  });

  it('allows a maintainer with self permission', () => {
    const user = makeUser({
      _id: 3,
      perm: perm(PERM.PERM_EDIT_CONTEST_SELF),
    });
    expect(canEditContest(user, { owner: 1, maintainer: [3] })).toBe(true);
  });

  it('denies the owner without self permission even with global edit', () => {
    const user = makeUser({ _id: 1, perm: perm(PERM.PERM_EDIT_CONTEST) });
    expect(canEditContest(user, { owner: 1 })).toBe(false);
  });

  it('denies a non-owner with only self permission', () => {
    const user = makeUser({
      _id: 2,
      perm: perm(PERM.PERM_EDIT_CONTEST_SELF),
    });
    expect(canEditContest(user, { owner: 1 })).toBe(false);
  });
});
