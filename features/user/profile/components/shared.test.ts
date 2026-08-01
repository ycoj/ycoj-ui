import { formatTime, getProfileExtras, getProfileUser } from './shared';
import type { UserDetailResponse } from '@/api/server/method/user/detail';
import { describe, expect, it } from 'vitest';

function makeUserDetail(
  udoc: Partial<UserDetailResponse['udoc']> &
    Pick<
      UserDetailResponse['udoc'],
      '_id' | 'mail' | 'uname' | 'priv' | 'regat' | 'loginat'
    >
): UserDetailResponse {
  return {
    checkinHistory: {
      timezone: 'UTC+08:00',
      from: '2025-01-01',
      to: '2025-12-31',
      total: 0,
      records: [],
    },
    isSelfProfile: false,
    udoc,
    sdoc: null,
    pdocs: [],
    tags: [],
    tdocs: [],
  };
}

describe('formatTime', () => {
  it('returns "-" for empty or invalid values', () => {
    expect(formatTime(null)).toBe('-');
    expect(formatTime(undefined)).toBe('-');
    expect(formatTime('')).toBe('-');
    expect(formatTime('not-a-date')).toBe('-');
  });

  it('formats valid dates as YYYY-MM-DD HH:mm', () => {
    expect(formatTime('2024-06-15T08:30:00.000Z')).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/
    );
  });
});

describe('getProfileExtras', () => {
  it('reads optional string and number fields from udoc', () => {
    const data = makeUserDetail({
      _id: 7,
      mail: 'u@example.com',
      uname: 'user7',
      priv: 0,
      regat: '2020-01-01T00:00:00.000Z',
      loginat: '2020-01-02T00:00:00.000Z',
      avatar: '  gravatar:a@b.com  ',
      bio: '  hello  ',
      rp: 12.5,
      nAccept: 10,
      nSubmit: 20,
    } as UserDetailResponse['udoc']);

    expect(getProfileExtras(data)).toEqual({
      avatar: 'gravatar:a@b.com',
      bio: 'hello',
      rp: 12.5,
      nAccept: 10,
      nSubmit: 20,
    });
  });

  it('omits blank strings and non-finite numbers', () => {
    const data = makeUserDetail({
      _id: 8,
      mail: 'u@example.com',
      uname: 'user8',
      priv: 0,
      regat: '2020-01-01T00:00:00.000Z',
      loginat: '2020-01-02T00:00:00.000Z',
      avatar: '   ',
      bio: '',
      rp: Number.NaN,
    } as UserDetailResponse['udoc']);

    expect(getProfileExtras(data)).toEqual({
      avatar: undefined,
      bio: undefined,
      rp: undefined,
      nAccept: undefined,
      nSubmit: undefined,
    });
  });
});

describe('getProfileUser', () => {
  it('maps base user fields and defaults avatar to empty string', () => {
    const data = makeUserDetail({
      _id: 9,
      mail: 'p@example.com',
      uname: 'profile',
      priv: 0,
      regat: '2020-01-01T00:00:00.000Z',
      loginat: '2020-01-02T00:00:00.000Z',
    });

    expect(getProfileUser(data)).toEqual({
      _id: 9,
      uname: 'profile',
      mail: 'p@example.com',
      avatar: '',
    });
  });

  it('includes trimmed avatar when present', () => {
    const data = makeUserDetail({
      _id: 10,
      mail: 'p@example.com',
      uname: 'profile',
      priv: 0,
      regat: '2020-01-01T00:00:00.000Z',
      loginat: '2020-01-02T00:00:00.000Z',
      avatar: 'github:octocat',
    } as UserDetailResponse['udoc']);

    expect(getProfileUser(data).avatar).toBe('github:octocat');
  });
});
