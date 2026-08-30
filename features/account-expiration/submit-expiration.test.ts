import { submitExpiration } from './submit-expiration';
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
  it('does not treat a sudo redirect as success', async () => {
    mocks.send.mockResolvedValue({ url: '/user/sudo' });
    await expect(
      submitExpiration({ operation: 'clear', uids: [1] }, 'failed')
    ).resolves.toBe('sudo');
  });
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
  it.each(['/login', 'https://elsewhere.example/other', '/user/sudo/other'])(
    'rejects unexpected success redirects: %s',
    async (url) => {
      mocks.send.mockResolvedValue({ url });
      await expect(
        submitExpiration({ operation: 'clear', uids: [1] }, 'failed')
      ).rejects.toThrow('failed');
    }
  );
});
