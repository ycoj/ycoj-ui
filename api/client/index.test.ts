import { clientRequest, handleClientSudoResponse } from './index';
import { SudoRedirectError } from '@/shared/lib/sudo-navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('@/shared/lib/sudo-navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/lib/sudo-navigation')>()),
  navigateToSudo: mocks.navigate,
}));

describe('global client sudo redirect', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.navigate.mockImplementation(() => {
      throw new SudoRedirectError();
    });
    window.history.replaceState({}, '', '/manage/setting');
  });
  afterEach(() => {
    window.history.replaceState({}, '', '/');
    vi.unstubAllGlobals();
  });
  it('intercepts protected responses from any feature', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ url: '/user/sudo' }), { status: 200 })
        )
    );
    await expect(
      clientRequest.Post('/manage/setting', {}).send()
    ).rejects.toBeInstanceOf(SudoRedirectError);
    expect(mocks.navigate).toHaveBeenCalledOnce();
  });
  it('does not redirect WebAuthn success back to the page it is already on', () => {
    window.history.replaceState({}, '', '/user/sudo');
    const response = { url: '/user/sudo' };
    expect(handleClientSudoResponse(response)).toBe(response);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it.each([
    null,
    'text',
    {},
    { error: { message: 'Forbidden' } },
    { url: '/home' },
  ])('leaves unrelated response %j unchanged', (response) => {
    expect(handleClientSudoResponse(response)).toBe(response);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
