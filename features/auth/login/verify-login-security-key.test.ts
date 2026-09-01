import { verifyLoginSecurityKey } from './verify-login-security-key';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getOptions: vi.fn(),
  verify: vi.fn(),
  startAuthentication: vi.fn(),
}));

vi.mock('@/api/client/method', () => ({
  default: {
    Auth: {
      getWebauthnOptions: mocks.getOptions,
      verifyWebauthn: mocks.verify,
    },
  },
}));
vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: mocks.startAuthentication,
}));

describe('verifyLoginSecurityKey', () => {
  beforeEach(() => vi.resetAllMocks());

  it('retrieves, verifies, and returns the login challenge', async () => {
    const result = { id: 'credential-id', response: {} };
    mocks.getOptions.mockReturnValue({
      send: vi.fn().mockResolvedValue({
        authOptions: { challenge: 'challenge-1' },
      }),
    });
    mocks.startAuthentication.mockResolvedValue(result);
    mocks.verify.mockReturnValue({
      send: vi.fn().mockResolvedValue({ url: '/login' }),
    });

    await expect(verifyLoginSecurityKey('alice', 'failed')).resolves.toBe(
      'challenge-1'
    );
    expect(mocks.getOptions).toHaveBeenCalledWith({
      uname: 'alice',
      login: false,
    });
    expect(mocks.startAuthentication).toHaveBeenCalledWith({
      optionsJSON: { challenge: 'challenge-1' },
    });
    expect(mocks.verify).toHaveBeenCalledWith(result);
  });

  it('surfaces a backend challenge failure', async () => {
    mocks.getOptions.mockReturnValue({
      send: vi
        .fn()
        .mockResolvedValue({ error: { message: 'Challenge expired' } }),
    });
    await expect(verifyLoginSecurityKey('alice', 'failed')).rejects.toThrow(
      'Challenge expired'
    );
    expect(mocks.startAuthentication).not.toHaveBeenCalled();
  });
});
