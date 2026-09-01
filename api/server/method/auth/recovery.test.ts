import { getPasswordReset } from './recovery';
import { describe, expect, it } from 'vitest';

describe('server password recovery request', () => {
  it('encodes reset tokens in the validation URL', () => {
    const method = getPasswordReset('token/with space');
    expect(method.url).toBe('/lostpass/token%2Fwith%20space');
  });
});
