import SudoRoutePage from '@/app/(public)/user/sudo/page';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  get: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock('@/features/user/lib/get-user', () => ({ getUser: mocks.user }));
vi.mock('@/api/server/method', () => ({
  default: { Auth: { getSudoPage: mocks.get } },
}));
vi.mock('@/features/auth/sudo/sudo-page', () => ({ default: () => null }));
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  unstable_rethrow: () => {},
}));

describe('standalone sudo route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.redirect.mockImplementation(() => {
      throw new Error('redirect');
    });
    mocks.user.mockResolvedValue({
      _id: 1,
      authn: true,
      tfa: true,
      realnameStatus: 'none',
    });
    mocks.get.mockResolvedValue({});
  });
  it('supports signed-in users without applying the real-name page gate', async () => {
    const page = await SudoRoutePage();
    expect(page.props.available).toBe(true);
    expect(page.props.capabilities).toEqual({ authn: true, tfa: true });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it('prefers TFA and WebAuthn flags from the sudo GET body', async () => {
    mocks.get.mockResolvedValue({ authn: false, tfa: true });
    const page = await SudoRoutePage();
    expect(page.props.available).toBe(true);
    expect(page.props.capabilities).toEqual({ authn: false, tfa: true });
  });
  it('falls back to nav user flags when the sudo body omits them', async () => {
    mocks.get.mockResolvedValue({});
    const page = await SudoRoutePage();
    expect(page.props.capabilities).toEqual({ authn: true, tfa: true });
  });
  it('requires login', async () => {
    mocks.user.mockResolvedValue({ _id: 0 });
    await expect(SudoRoutePage()).rejects.toThrow('redirect');
    expect(mocks.get).not.toHaveBeenCalled();
  });
  it('handles direct access without a pending operation', async () => {
    mocks.get.mockResolvedValue({ error: { message: 'Forbidden' } });
    const page = await SudoRoutePage();
    expect(page.props.available).toBe(false);
  });
});
