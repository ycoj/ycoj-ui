import { getPasswordResetPage } from './get-password-reset-page';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/api/server/method', () => ({
  default: { Auth: { getPasswordReset: mocks.get } },
}));
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

describe('getPasswordResetPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns the username for a valid reset token', async () => {
    mocks.get.mockResolvedValue({ uname: 'alice' });
    await expect(getPasswordResetPage('token')).resolves.toEqual({
      kind: 'data',
      username: 'alice',
    });
  });

  it('turns invalid tokens into a renderable error state', async () => {
    mocks.get.mockResolvedValue({ error: { message: 'Invalid token' } });
    await expect(getPasswordResetPage('token')).resolves.toEqual({
      kind: 'error',
      message: 'Invalid token',
    });
  });
});
