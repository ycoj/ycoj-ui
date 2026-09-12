import { getScoreboardExportData } from './scoreboard';
import { afterEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ cookie: 'sid=first' }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ Cookie: session.cookie }),
}));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

afterEach(() => vi.unstubAllGlobals());
describe('server scoreboard authorization context', () => {
  it('forwards each requester’s session without sharing cached private export data', async () => {
    const fetch = vi.fn(
      async (_url, init: RequestInit) =>
        new Response(
          JSON.stringify({
            session: (init.headers as Record<string, string>).Cookie,
          })
        )
    );
    vi.stubGlobal('fetch', fetch);
    session.cookie = 'sid=first';
    const first = await getScoreboardExportData('contest', 'tid', {
      realName: true,
      details: true,
    });
    session.cookie = 'sid=second';
    const second = await getScoreboardExportData('contest', 'tid', {
      realName: true,
      details: true,
    });
    expect(first).toEqual({ session: 'sid=first' });
    expect(second).toEqual({ session: 'sid=second' });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(fetch.mock.calls[0][0])).toContain(
      '/contest/tid/scoreboard/export-data?details=true'
    );
  });
  it('uses the ordinary scoreboard for a public image, without requesting private fields', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ rows: [] })));
    vi.stubGlobal('fetch', fetch);
    await getScoreboardExportData('homework', 'tid', {
      realName: false,
      details: false,
    });
    expect(String(fetch.mock.calls[0][0])).toMatch(
      /\/homework\/tid\/scoreboard$/
    );
  });
});
