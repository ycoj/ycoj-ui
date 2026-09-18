import { resolveLoginRedirect } from './resolve-login-redirect';
import { describe, expect, it } from 'vitest';

const ORIGIN = 'https://ycoj.example';

describe('resolveLoginRedirect', () => {
  it.each([
    ['https://ycoj.example/problem/1001?tid=abc', '/problem/1001?tid=abc'],
    ['https://ycoj.example/problems#list', '/problems#list'],
    ['https://ycoj.example/', '/'],
  ])('returns the same-site referrer: %s', (referrer, expected) => {
    expect(resolveLoginRedirect(referrer, ORIGIN)).toBe(expected);
  });

  it.each([
    ['', 'no referrer'],
    ['not a url', 'invalid referrer'],
    ['https://other.example/problem/1', 'external referrer'],
    ['https://ycoj.example/login', 'login referrer'],
    ['https://ycoj.example/login/', 'login referrer trailing slash'],
    ['https://ycoj.example/login?redirect=%2Fhome', 'login referrer query'],
    ['https://ycoj.example//other.example', 'protocol-relative path'],
  ])('falls back to /home for %s (%s)', (referrer) => {
    expect(resolveLoginRedirect(referrer, ORIGIN)).toBe('/home');
  });

  it('prefers an explicit redirect over the referrer', () => {
    expect(
      resolveLoginRedirect(
        'https://ycoj.example/problem/1',
        ORIGIN,
        '/user/sudo'
      )
    ).toBe('/user/sudo');
  });

  it('ignores an empty explicit redirect', () => {
    expect(
      resolveLoginRedirect('https://ycoj.example/problem/1', ORIGIN, '')
    ).toBe('/problem/1');
  });
});
