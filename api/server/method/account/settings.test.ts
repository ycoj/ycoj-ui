import { getAccountSettings } from './settings';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({
  headers: async () => new Headers({ Cookie: 'sid=account-session' }),
}));

afterEach(() => vi.unstubAllGlobals());

describe('getAccountSettings', () => {
  it('returns current/settings/category and forwards the login cookie', async () => {
    const body = {
      category: 'account',
      current: { _id: 2, uname: 'alice', qq: '12345' },
      settings: [{ key: 'qq', type: 'text' }],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(body)));
    vi.stubGlobal('fetch', fetchMock);
    const method = getAccountSettings();
    expect(method.url).toBe('/home/settings/account');
    await expect(method.send()).resolves.toEqual(body);
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({
      Cookie: 'sid=account-session',
      Accept: 'application/json',
    });
  });
});
