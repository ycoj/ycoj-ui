import { verifySecurityKey } from './verify-security-key';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  options: vi.fn(),
  verify: vi.fn(),
  sendOptions: vi.fn(),
  sendVerify: vi.fn(),
  start: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    Auth: {
      getWebauthnOptions: mocks.options,
      verifyWebauthn: mocks.verify,
    },
  },
}));
vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: mocks.start,
}));

describe('verifySecurityKey', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.options.mockReturnValue({ send: mocks.sendOptions });
    mocks.verify.mockReturnValue({ send: mocks.sendVerify });
    mocks.sendOptions.mockResolvedValue({
      authOptions: { challenge: 'challenge-1' },
    });
    mocks.start.mockResolvedValue({ id: 'key-id' });
    mocks.sendVerify.mockResolvedValue({ url: '/user/sudo' });
  });

  it.each([
    '/user/sudo',
    '/d/system/user/sudo',
    'https://host/d/foo/user/sudo',
  ])('accepts a return path match: %s', async (url) => {
    mocks.sendVerify.mockResolvedValue({ url });
    await expect(verifySecurityKey('/user/sudo', 'failed')).resolves.toBe(
      'challenge-1'
    );
  });
  it('accepts a sudo redirect even when it is not the return path', async () => {
    mocks.sendVerify.mockResolvedValue({ url: '/d/system/user/sudo' });
    await expect(
      verifySecurityKey('/manage/user-expiration', 'failed')
    ).resolves.toBe('challenge-1');
  });
  it.each(['/', '/d/system/', 'https://host/'])(
    'accepts Handler.back() to %s',
    async (url) => {
      mocks.sendVerify.mockResolvedValue({ url });
      await expect(verifySecurityKey('/user/sudo', 'failed')).resolves.toBe(
        'challenge-1'
      );
    }
  );
  it('throws when the verification response has no url', async () => {
    mocks.sendVerify.mockResolvedValue({});
    await expect(verifySecurityKey('/user/sudo', 'failed')).rejects.toThrow(
      'failed'
    );
  });
  it('surfaces backend errors', async () => {
    mocks.sendVerify.mockResolvedValue({
      error: { message: 'Challenge expired' },
    });
    await expect(verifySecurityKey('/user/sudo', 'failed')).rejects.toThrow(
      'Challenge expired'
    );
  });
  it.each(['/login', '/d/system/login', '/login?redirect=%2Fhome'])(
    'rejects login redirects: %s',
    async (url) => {
      mocks.sendVerify.mockResolvedValue({ url });
      await expect(verifySecurityKey('/user/sudo', 'failed')).rejects.toThrow(
        'failed'
      );
    }
  );
  it('rejects an unexpected redirect', async () => {
    mocks.sendVerify.mockResolvedValue({
      url: 'https://elsewhere.example/other',
    });
    await expect(verifySecurityKey('/user/sudo', 'failed')).rejects.toThrow(
      'failed'
    );
  });
});
