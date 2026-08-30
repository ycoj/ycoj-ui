import {
  expirationStatus,
  isExpirationDate,
  parseExpirationPage,
  updateExpirationSelection,
} from './expiration-utils';
import type { AccountExpirationUser } from '@/shared/types/account-expiration';
import { describe, expect, it } from 'vitest';

const user: AccountExpirationUser = {
  _id: 1,
  uname: 'alice',
  mail: '',
  avatar: '',
  priv: 4,
  accountExpireDate: '2026-09-01',
  accountExpired: false,
  accountAutoExpired: false,
  accountExpirationProtected: false,
};

describe('account expiration helpers', () => {
  it('preserves backend status precedence', () => {
    expect(expirationStatus(user)).toBe('active');
    expect(expirationStatus({ ...user, accountExpired: true })).toBe('expired');
    expect(expirationStatus({ ...user, priv: 0, accountExpired: true })).toBe(
      'banned'
    );
    expect(
      expirationStatus({
        ...user,
        priv: 0,
        accountExpired: true,
        accountAutoExpired: true,
      })
    ).toBe('autoExpired');
    expect(
      expirationStatus({
        ...user,
        priv: 0,
        accountExpired: true,
        accountAutoExpired: true,
        accountExpirationProtected: true,
      })
    ).toBe('protected');
  });
  it.each(['2026-09-01', '2024-02-29', '2000-01-01'])(
    'accepts date-only values including past dates: %s',
    (value) => expect(isExpirationDate(value)).toBe(true)
  );
  it.each([
    '',
    '2026-02-29',
    '2026-02-30',
    '2026-13-01',
    '2026-1-1',
    '2026-09-01T00:00:00Z',
  ])('rejects invalid dates: %s', (value) =>
    expect(isExpirationDate(value)).toBe(false)
  );
  it.each([undefined, '', '0', '-1', '1.5', '3abc', 'Infinity'])(
    'normalizes invalid page %s',
    (value) => expect(parseExpirationPage(value)).toBe(1)
  );
  it('accepts positive pages', () =>
    expect(parseExpirationPage('12')).toBe(12));
  it('selects and deselects ranges without touching protected users', () => {
    const users = [
      user,
      { ...user, _id: 2, accountExpirationProtected: true },
      { ...user, _id: 3 },
      { ...user, _id: 4 },
    ];
    expect(updateExpirationSelection(users, [1], 3, 0, true)).toEqual([
      1, 3, 4,
    ]);
    expect(updateExpirationSelection(users, [1, 3, 4], 0, 3, true)).toEqual([]);
    expect(updateExpirationSelection(users, [1], 1, 0, true)).toEqual([1]);
    expect(updateExpirationSelection(users, [1], 3, null, false)).toEqual([
      1, 4,
    ]);
  });
});
