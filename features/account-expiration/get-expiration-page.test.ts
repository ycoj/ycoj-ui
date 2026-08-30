import { getExpirationPage } from '@/features/account-expiration/get-expiration-page';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), redirect: vi.fn() }));
vi.mock('@/api/server/method', () => ({
  default: { AccountExpiration: { getAccountExpirations: mocks.get } },
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  unstable_rethrow: (error: Error) => {
    if (error.message === 'NEXT_REDIRECT') throw error;
  },
}));
describe('expiration page loader', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.redirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
  });
  it('returns the backend list without date conversion', async () => {
    const data = { udocs: [], page: 2, q: 'alice', count: 0, numPages: 0 };
    mocks.get.mockResolvedValue(data);
    await expect(getExpirationPage(2, 'alice')).resolves.toEqual({
      kind: 'data',
      data,
    });
    expect(mocks.get).toHaveBeenCalledWith(2, 'alice');
  });
  it('gates the page on a sudo redirect', async () => {
    mocks.get.mockResolvedValue({ url: '/user/sudo' });
    await expect(getExpirationPage(1, '')).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.redirect).toHaveBeenCalledWith('/user/sudo');
  });
  it('surfaces backend and network errors', async () => {
    mocks.get
      .mockResolvedValueOnce({ error: { message: 'Forbidden' } })
      .mockRejectedValueOnce(new Error('Offline'));
    await expect(getExpirationPage(1, '')).resolves.toEqual({
      kind: 'error',
      message: 'Forbidden',
    });
    await expect(getExpirationPage(1, '')).resolves.toEqual({
      kind: 'error',
      message: 'loadFailed',
    });
  });
  it('never renders a redirected login response as list data', async () => {
    mocks.get.mockResolvedValue({ url: '/login' });
    await expect(getExpirationPage(1, '')).resolves.toEqual({
      kind: 'error',
      message: 'loadFailed',
    });
  });
});
