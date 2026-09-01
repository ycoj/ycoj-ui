import { getLoginFactors, login } from './login';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllGlobals());

describe('authentication requests', () => {
  it('probes login factors with the username query', () => {
    const method = getLoginFactors('alice');
    expect(method.url).toBe('/user/tfa');
    expect(method.config.params).toEqual({ q: 'alice' });
  });

  it('preserves second-factor fields in the login payload', () => {
    const method = login({
      uname: 'alice',
      password: 'secret',
      rememberme: true,
      redirect: '/home',
      authnChallenge: 'challenge-1',
    });
    expect(method.url).toBe('/login');
    expect(method.data).toEqual({
      uname: 'alice',
      password: 'secret',
      rememberme: true,
      redirect: '/home',
      authnChallenge: 'challenge-1',
    });
  });
});
