import { canEnterScratchpad } from './scratchpad-eligibility';
import { PERM } from '@/features/user/lib/priv';
import type { User } from '@/shared/types/user';
import { describe, expect, it } from 'vitest';

function userWithPerm(perm: bigint): User {
  return {
    _id: 2,
    uname: 'user',
    mail: '',
    avatar: '',
    perm: `BigInt::${perm}`,
    role: 'default',
    priv: 0,
    regat: '',
    loginat: '',
    tfa: false,
    authn: false,
  };
}

describe('canEnterScratchpad', () => {
  it('allows submitters in normal and active contest modes', () => {
    const user = userWithPerm(PERM.PERM_SUBMIT_PROBLEM);
    expect(canEnterScratchpad(user, 'normal', false)).toBe(true);
    expect(canEnterScratchpad(user, 'contest', false)).toBe(true);
  });

  it('rejects guests, missing permission, objective problems, and ended contexts', () => {
    expect(canEnterScratchpad(null, 'normal', false)).toBe(false);
    expect(canEnterScratchpad(userWithPerm(BigInt(0)), 'normal', false)).toBe(
      false
    );
    expect(
      canEnterScratchpad(userWithPerm(PERM.PERM_SUBMIT_PROBLEM), 'normal', true)
    ).toBe(false);
    expect(
      canEnterScratchpad(
        userWithPerm(PERM.PERM_SUBMIT_PROBLEM),
        'correction',
        false
      )
    ).toBe(false);
    expect(
      canEnterScratchpad(
        userWithPerm(PERM.PERM_SUBMIT_PROBLEM),
        'contest',
        false,
        false
      )
    ).toBe(false);
  });
});
