import { submitExpiration } from '@/features/account-expiration/submit-expiration';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  set: vi.fn(),
  adjust: vi.fn(),
  clear: vi.fn(),
  send: vi.fn(),
}));
vi.mock('@/api/client/method', () => ({
  default: {
    AccountExpiration: {
      setAccountExpiration: mocks.set,
      adjustAccountExpiration: mocks.adjust,
      clearAccountExpiration: mocks.clear,
    },
  },
}));

describe('submitExpiration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    for (const method of [mocks.set, mocks.adjust, mocks.clear])
      method.mockReturnValue({ send: mocks.send });
    mocks.send.mockResolvedValue({ url: '/manage/user-expiration?q=alice' });
  });
  it('dispatches the three typed actions', async () => {
    await expect(
      submitExpiration(
        { operation: 'set', uids: [1, 2], expireDate: '2026-09-01' },
        'failed'
      )
    ).resolves.toBe('success');
    expect(mocks.set).toHaveBeenCalledWith([1, 2], '2026-09-01');
    await submitExpiration(
      { operation: 'adjust', uids: [1], days: -3 },
      'failed'
    );
    expect(mocks.adjust).toHaveBeenCalledWith([1], -3);
    await submitExpiration({ operation: 'clear', uids: [1] }, 'failed');
    expect(mocks.clear).toHaveBeenCalledWith([1]);
  });
  it.each(['/user/sudo', '/d/system/user/sudo'])(
    'does not treat a sudo redirect as success: %s',
    async (url) => {
      mocks.send.mockResolvedValue({ url });
      await expect(
        submitExpiration({ operation: 'clear', uids: [1] }, 'failed')
      ).resolves.toBe('sudo');
    }
  );
  it('surfaces JSON backend errors even with a successful HTTP response', async () => {
    mocks.send.mockResolvedValue({ error: { message: 'Protected account' } });
    await expect(
      submitExpiration({ operation: 'clear', uids: [1] }, 'failed')
    ).rejects.toThrow('Protected account');
  });
  it('never retries an uncertain adjustment automatically', async () => {
    mocks.send.mockRejectedValue(new Error('Network error'));
    await expect(
      submitExpiration({ operation: 'adjust', uids: [1], days: 1 }, 'failed')
    ).rejects.toThrow('Network error');
    expect(mocks.adjust).toHaveBeenCalledOnce();
  });
  it.each(['/login', '/d/system/login', '/login?redirect=%2Fhome'])(
    'rejects login redirects: %s',
    async (url) => {
      mocks.send.mockResolvedValue({ url });
      await expect(
        submitExpiration({ operation: 'clear', uids: [1] }, 'failed')
      ).rejects.toThrow('failed');
    }
  );
  it.each([
    'https://elsewhere.example/other',
    '/',
    '/d/system/manage/user-expiration?q=alice',
  ])(
    'treats an applied write as success even if the referer is %s',
    async (url) => {
      mocks.send.mockResolvedValue({ url });
      await expect(
        submitExpiration({ operation: 'clear', uids: [1] }, 'failed')
      ).resolves.toBe('success');
    }
  );
});
