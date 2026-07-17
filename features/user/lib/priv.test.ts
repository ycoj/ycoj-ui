import { hasPerm, hasPriv, PERM, PRIV } from './priv';
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

describe('hasPriv', () => {
  it('returns true when the user has the required privilege bit', () => {
    const user = makeUser({ priv: PRIV.PRIV_JUDGE | PRIV.PRIV_REJUDGE });
    expect(hasPriv(user, PRIV.PRIV_JUDGE)).toBe(true);
    expect(hasPriv(user, PRIV.PRIV_REJUDGE)).toBe(true);
  });

  it('returns false when a required privilege bit is missing', () => {
    const user = makeUser({ priv: PRIV.PRIV_JUDGE });
    expect(hasPriv(user, PRIV.PRIV_REJUDGE)).toBe(false);
  });

  it('requires all bits when multiple privileges are requested', () => {
    const user = makeUser({ priv: PRIV.PRIV_JUDGE });
    expect(hasPriv(user, PRIV.PRIV_JUDGE | PRIV.PRIV_REJUDGE)).toBe(false);
  });
});

describe('hasPerm', () => {
  it('parses BigInt:: serialized permissions', () => {
    const permValue = PERM.PERM_VIEW_PROBLEM | PERM.PERM_SUBMIT_PROBLEM;
    const user = makeUser({ perm: `BigInt::${permValue.toString()}` });

    expect(hasPerm(user, PERM.PERM_VIEW_PROBLEM)).toBe(true);
    expect(hasPerm(user, PERM.PERM_SUBMIT_PROBLEM)).toBe(true);
    expect(hasPerm(user, PERM.PERM_EDIT_PROBLEM)).toBe(false);
  });

  it('requires all requested permission bits', () => {
    const user = makeUser({
      perm: `BigInt::${PERM.PERM_VIEW_PROBLEM.toString()}`,
    });

    expect(
      hasPerm(user, PERM.PERM_VIEW_PROBLEM | PERM.PERM_SUBMIT_PROBLEM)
    ).toBe(false);
  });
});
