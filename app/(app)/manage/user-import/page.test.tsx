import UserImportPage from './page';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ user: vi.fn(), redirect: vi.fn() }));
vi.mock('@/features/user/lib/get-user', () => ({ getUser: mocks.user }));
vi.mock('@/features/manage/user-import/user-import-form', () => ({
  default: () => null,
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

describe('user import access', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.redirect.mockImplementation(() => {
      throw new Error('redirect');
    });
  });
  it.each([0, 4])(
    'rejects users without system editing privilege (%s)',
    async (priv) => {
      mocks.user.mockResolvedValue({ priv });
      await expect(UserImportPage()).rejects.toThrow('redirect');
      expect(mocks.redirect).toHaveBeenCalledWith('/home');
    }
  );
  it.each([-1, 5])('allows system editors (%s)', async (priv) => {
    mocks.user.mockResolvedValue({ priv });
    expect(await UserImportPage()).toBeTruthy();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
