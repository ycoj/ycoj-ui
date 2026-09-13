import { DownloadResponseError, toDownloadBlob } from './download';
import { describe, expect, it } from 'vitest';

describe('toDownloadBlob', () => {
  it('returns blobs for supported media types with parameters', async () => {
    const blob = await toDownloadBlob(
      new Response('png', {
        headers: { 'content-type': 'image/png; charset=binary' },
      })
    );
    expect(await blob.text()).toBe('png');
  });
  it('returns ZIP archives', async () => {
    const blob = await toDownloadBlob(
      new Response('zip', { headers: { 'content-type': 'application/zip' } })
    );
    expect(await blob.text()).toBe('zip');
  });
  it('throws a typed error carrying the server message for failed responses', async () => {
    const failed = toDownloadBlob(
      Response.json({ error: 'Forbidden' }, { status: 403 })
    );
    await expect(failed).rejects.toBeInstanceOf(DownloadResponseError);
    await expect(failed).rejects.toThrow('Forbidden');
  });
  it('falls back to a generic message when the error body is not JSON', async () => {
    const failed = toDownloadBlob(
      new Response('<html>gateway</html>', {
        status: 502,
        headers: { 'content-type': 'text/html' },
      })
    );
    await expect(failed).rejects.not.toBeInstanceOf(DownloadResponseError);
    await expect(failed).rejects.toThrow('Download failed');
  });
  it('rejects unexpected media types', async () => {
    await expect(
      toDownloadBlob(
        new Response('nope', { headers: { 'content-type': 'text/html' } })
      )
    ).rejects.toThrow('Download failed');
  });
});
