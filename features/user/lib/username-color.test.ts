import getUsernameColor from './username-color';
import type { BaseUser } from '@/shared/types/user';
import { describe, expect, it } from 'vitest';

function makeUser(uojRating?: number | null): BaseUser {
  return {
    _id: 1,
    uname: 'alice',
    mail: 'a@example.com',
    avatar: '',
    uojRating: uojRating as number | undefined,
  };
}

describe('getUsernameColor', () => {
  it('defaults null/undefined rating to 1500 color', () => {
    const defaultColor = getUsernameColor(makeUser(1500));
    expect(getUsernameColor(makeUser(null))).toBe(defaultColor);
    expect(getUsernameColor(makeUser(undefined))).toBe(defaultColor);
  });

  it('returns rgb() colors for low, mid, and high ratings', () => {
    expect(getUsernameColor(makeUser(800))).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(getUsernameColor(makeUser(1500))).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(getUsernameColor(makeUser(2200))).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });

  it('clamps very low and very high ratings deterministically', () => {
    expect(getUsernameColor(makeUser(0))).toBe(getUsernameColor(makeUser(300)));
    expect(getUsernameColor(makeUser(3000))).toBe(
      getUsernameColor(makeUser(2500))
    );
  });

  it('produces different colors across rating tiers', () => {
    const low = getUsernameColor(makeUser(1000));
    const mid = getUsernameColor(makeUser(1800));
    const high = getUsernameColor(makeUser(2400));
    expect(new Set([low, mid, high]).size).toBe(3);
  });
});
