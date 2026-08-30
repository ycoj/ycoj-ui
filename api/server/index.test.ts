import { alova } from './index';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ Cookie: 'sid=test-session' }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

describe('global server sudo redirect', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });
  it('propagates the original Next redirect exception', async () => {
    const redirectError = new Error('NEXT_REDIRECT');
    mocks.redirect.mockImplementation(() => {
      throw redirectError;
    });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ url: '/user/sudo' })))
    );
    await expect(alova.Get('/manage/setting').send()).rejects.toBe(
      redirectError
    );
    expect(mocks.redirect).toHaveBeenCalledWith('/user/sudo');
  });
});
