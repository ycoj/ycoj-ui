import AccountExpirationPage from '@/app/(app)/manage/user-expiration/page';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  load: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('@/features/user/lib/get-user', () => ({ getUser: mocks.user }));
vi.mock('@/features/account-expiration/get-expiration-page', () => ({
  getExpirationPage: mocks.load,
}));
vi.mock('@/features/account-expiration/expiration-page', () => ({
  default: () => null,
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

describe('account expiration route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.redirect.mockImplementation(() => {
      throw new Error('redirect');
    });
    mocks.load.mockResolvedValue({ kind: 'error', message: 'Unavailable' });
  });
  it('never requests account data for an unauthorized visitor', async () => {
    mocks.user.mockResolvedValue({ priv: 4 });
    await expect(
      AccountExpirationPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow('redirect');
    expect(mocks.redirect).toHaveBeenCalledWith('/home');
    expect(mocks.load).not.toHaveBeenCalled();
  });
  it.each([-1, 5])('allows system management privilege %s', async (priv) => {
    mocks.user.mockResolvedValue({ priv, authn: true, tfa: false });
    const page = await AccountExpirationPage({
      searchParams: Promise.resolve({ page: '2', q: ' alice ' }),
    });
    expect(mocks.load).toHaveBeenCalledWith(2, 'alice');
    expect(page.props.query).toBe('alice');
  });
  it('remounts selection and pending actions when the search or page changes', async () => {
    mocks.user.mockResolvedValue({ priv: -1 });
    const first = await AccountExpirationPage({
      searchParams: Promise.resolve({ page: '1', q: 'alice' }),
    });
    const second = await AccountExpirationPage({
      searchParams: Promise.resolve({ page: '2', q: 'alice' }),
    });
    const third = await AccountExpirationPage({
      searchParams: Promise.resolve({ page: '1', q: 'bob' }),
    });
    expect(first.key).not.toBe(second.key);
    expect(first.key).not.toBe(third.key);
  });
});
