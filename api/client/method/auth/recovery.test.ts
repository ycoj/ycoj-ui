import { completePasswordReset, requestPasswordReset } from './recovery';
import { describe, expect, it } from 'vitest';

describe('password recovery requests', () => {
  it('posts the reset email', () => {
    const method = requestPasswordReset('alice@example.com');
    expect(method.url).toBe('/lostpass');
    expect(method.data).toEqual({ mail: 'alice@example.com' });
  });

  it('encodes the token and posts both password fields', () => {
    const method = completePasswordReset({
      code: 'token/with space',
      password: 'new secret',
      verifyPassword: 'new secret',
    });
    expect(method.url).toBe('/lostpass/token%2Fwith%20space');
    expect(method.data).toEqual({
      password: 'new secret',
      verifyPassword: 'new secret',
    });
  });
});
