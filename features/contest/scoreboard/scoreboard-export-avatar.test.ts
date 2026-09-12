// @vitest-environment node
import { loadExportAvatar } from './scoreboard-export-avatar';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.restoreAllMocks());
describe('server export avatars', () => {
  it('follows the GitHub avatar redirect and embeds the image', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: 'https://avatars.githubusercontent.com/u/2' },
        })
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3]), {
          headers: { 'content-type': 'image/png' },
        })
      );
    expect(
      await loadExportAvatar('github:alice', new AbortController().signal)
    ).toBe('data:image/png;base64,AQID');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(fetch.mock.calls[1][0])).toBe(
      'https://avatars.githubusercontent.com/u/2'
    );
  });
  it('does not follow redirects outside the known avatar providers', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1/private' },
      })
    );
    expect(
      await loadExportAvatar('github:alice', new AbortController().signal)
    ).toBe('');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('omits failed avatars without failing the export', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    expect(
      await loadExportAvatar('github:alice', new AbortController().signal)
    ).toBe('');
  });
});
