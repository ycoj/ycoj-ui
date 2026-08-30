import {
  backendPathname,
  isAuthSessionPath,
  isLoginRedirect,
  isSudoRequired,
  matchesBackendPath,
  throwBackendError,
} from './backend-response';
import { describe, expect, it } from 'vitest';

describe('matchesBackendPath', () => {
  it.each(['/user/sudo', 'https://host/user/sudo'])(
    'matches an unprefixed sudo path: %s',
    (url) => {
      expect(matchesBackendPath(url, '/user/sudo')).toBe(true);
    }
  );
  it.each(['/d/system/user/sudo', 'https://host/d/foo/user/sudo'])(
    'strips a single /d/{domain} prefix: %s',
    (url) => {
      expect(matchesBackendPath(url, '/user/sudo')).toBe(true);
    }
  );
  it('matches a domain-prefixed expiration path', () => {
    expect(
      matchesBackendPath(
        '/d/system/manage/user-expiration',
        '/manage/user-expiration'
      )
    ).toBe(true);
  });
  it('does not treat an unrelated path as sudo', () => {
    expect(matchesBackendPath('/home', '/user/sudo')).toBe(false);
  });
  it('matches by pathname even when the origin differs', () => {
    expect(
      matchesBackendPath('https://evil.example/user/sudo', '/user/sudo')
    ).toBe(true);
  });
  it('returns false for invalid URLs', () => {
    expect(matchesBackendPath('https://', '/user/sudo')).toBe(false);
  });
});

describe('backendPathname', () => {
  it('drops only a domain prefix that is followed by another segment', () => {
    expect(backendPathname('/d/system')).toBe('/d/system');
    expect(backendPathname('/d/system/')).toBe('/');
  });
});

describe('isSudoRequired', () => {
  it.each([
    '/user/sudo',
    '/d/system/user/sudo',
    'https://host/d/foo/user/sudo',
  ])('detects sudo redirects: %s', (url) => {
    expect(isSudoRequired({ url })).toBe(true);
  });
  it('ignores unrelated payloads', () => {
    expect(isSudoRequired({ url: '/home' })).toBe(false);
    expect(isSudoRequired({ error: { message: 'Forbidden' } })).toBe(false);
  });
});

describe('isLoginRedirect', () => {
  it.each(['/login', '/login?redirect=%2Fhome', '/d/system/login'])(
    'detects login redirects: %s',
    (url) => {
      expect(isLoginRedirect(url)).toBe(true);
    }
  );
  it('does not treat other paths as login', () => {
    expect(isLoginRedirect('/manage/user-expiration')).toBe(false);
  });
});

describe('isAuthSessionPath', () => {
  it.each([
    '/login',
    '/logout',
    '/register',
    '/user/sudo',
    '/user/webauthn',
    '/d/system/logout',
    '/d/foo/user/webauthn',
  ])('blocks auth session paths: %s', (url) => {
    expect(isAuthSessionPath(url)).toBe(true);
  });
  it.each(['/manage/setting', '/d/system/manage/setting'])(
    'allows manage paths: %s',
    (url) => {
      expect(isAuthSessionPath(url)).toBe(false);
    }
  );
});

describe('throwBackendError', () => {
  it('interpolates Hydro error params', () => {
    expect(() =>
      throwBackendError({
        error: { message: 'User {0} not found', params: ['alice'] },
      })
    ).toThrow('User alice not found');
  });
  it('does not throw TypeError when error is null', () => {
    expect(() => throwBackendError({ error: null })).toThrow('Request failed');
  });
  it('stringifies unexpected error payloads', () => {
    expect(() => throwBackendError({ error: 'offline' })).toThrow('offline');
  });
  it('ignores responses without an error field', () => {
    expect(() => throwBackendError({ url: '/home' })).not.toThrow();
  });
});
