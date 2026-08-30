import { confirmSudo, getWebauthnOptions } from '../auth/sudo';
import {
  adjustAccountExpiration,
  clearAccountExpiration,
  setAccountExpiration,
} from './index';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('account expiration API', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('sends typed operations with session cookies and JSON accept headers', async () => {
    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ url: '/manage/user-expiration' }), {
          status: 200,
        })
    );
    vi.stubGlobal('fetch', fetchMock);
    await setAccountExpiration([1, 2], '2026-09-01').send();
    await adjustAccountExpiration([1], -2).send();
    await clearAccountExpiration([1]).send();
    const bodies = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body));
    expect(bodies).toEqual([
      { operation: 'set', uids: [1, 2], expireDate: '2026-09-01' },
      { operation: 'adjust', uids: [1], days: -2 },
      { operation: 'clear', uids: [1] },
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/manage/user-expiration');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  });
  it('requests fresh, non-login security-key challenges', () => {
    const method = getWebauthnOptions();
    expect(method.url).toBe('/user/webauthn');
    expect(method.config.params).toEqual({ login: false });
    expect(method.config.cacheFor).toBe(0);
    expect(confirmSudo('tfa', '012345').data).toEqual({ tfa: '012345' });
  });
});
