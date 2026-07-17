import avatarUrl from './avatar-url';
import md5 from '@/shared/lib/md5';
import { describe, expect, it } from 'vitest';

describe('avatarUrl', () => {
  it('returns empty string for invalid input', () => {
    expect(avatarUrl('')).toBe('');
    expect(avatarUrl('no-colon')).toBe('');
    expect(avatarUrl('unknown:id')).toBe('');
  });

  it('builds gravatar URLs with normalized email hash', () => {
    const email = '  User@Example.COM ';
    const hash = md5(email.trim().toLowerCase());
    expect(avatarUrl(`gravatar:${email}`, 48)).toBe(
      `https://gravatar.loli.net/avatar/${hash}?d=mm&s=48`
    );
  });

  it('builds qq avatar URLs from digits in the id', () => {
    expect(avatarUrl('qq:qq_12345_x')).toBe(
      '//q1.qlogo.cn/g?b=qq&nk=12345&s=160'
    );
  });

  it('builds github avatar URLs with capped size', () => {
    expect(avatarUrl('github:octocat', 800)).toBe(
      '//github.com/octocat.png?size=460'
    );
    expect(avatarUrl('github:octocat', 64)).toBe(
      '//github.com/octocat.png?size=64'
    );
  });
});
