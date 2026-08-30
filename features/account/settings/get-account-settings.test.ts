import { getAccountSettings } from './get-account-settings';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), getSettings: vi.fn() }));
vi.mock('@/features/user/lib/get-user', () => ({ getUser: mocks.getUser }));
vi.mock('@/api/server/method', () => ({
  default: { Account: { getAccountSettings: mocks.getSettings } },
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ _id: 2, priv: 4 });
});

describe('account settings access', () => {
  it.each([
    { _id: 0, priv: 0 },
    { _id: 2, priv: 0 },
  ])('redirects guests and users without profile privileges', async (user) => {
    mocks.getUser.mockResolvedValue(user);
    await expect(getAccountSettings()).rejects.toThrow('redirect:/login');
    expect(mocks.getSettings).not.toHaveBeenCalled();
  });

  it('loads the authenticated account data', async () => {
    const data = { category: 'account', current: { _id: 2 }, settings: [] };
    mocks.getSettings.mockResolvedValue(data);
    await expect(getAccountSettings()).resolves.toEqual(data);
  });

  it.each([
    { url: '/login' },
    { error: { name: 'PrivilegeError', message: 'Denied' } },
  ])('handles backend authentication failures', async (response) => {
    mocks.getSettings.mockResolvedValue(response);
    await expect(getAccountSettings()).rejects.toThrow('redirect:/login');
  });
});
