// @vitest-environment node
import {
  MAX_EXPORT_AVATAR_DIMENSION,
  MAX_EXPORT_AVATAR_PIXELS,
  loadExportAvatar,
} from './scoreboard-export-avatar';
import { afterEach, describe, expect, it, vi } from 'vitest';

const MAX_AVATAR_BYTES = 1024;

function pngBody(width: number, height: number) {
  const body = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(body);
  body.writeUInt32BE(13, 8);
  body.write('IHDR', 12, 'ascii');
  body.writeUInt32BE(width, 16);
  body.writeUInt32BE(height, 20);
  body[24] = 8;
  body[25] = 6;
  return body;
}

function gifBody(
  screenWidth: number,
  screenHeight: number,
  frame: { width: number; height: number } = {
    width: screenWidth,
    height: screenHeight,
  },
  { extension = false, globalColorTable = false } = {}
) {
  const globalTable = globalColorTable ? Buffer.alloc(6) : Buffer.alloc(0);
  const extensionBytes = extension
    ? Buffer.from([0x21, 0xfe, 0x03, 0x61, 0x62, 0x63, 0x00])
    : Buffer.alloc(0);
  const body = Buffer.alloc(
    13 + globalTable.length + extensionBytes.length + 11
  );
  body.write('GIF89a', 0, 'ascii');
  body.writeUInt16LE(screenWidth, 6);
  body.writeUInt16LE(screenHeight, 8);
  body[10] = globalColorTable ? 0x80 : 0x00;
  globalTable.copy(body, 13);
  extensionBytes.copy(body, 13 + globalTable.length);
  const offset = 13 + globalTable.length + extensionBytes.length;
  body[offset] = 0x2c;
  body.writeUInt16LE(frame.width, offset + 5);
  body.writeUInt16LE(frame.height, offset + 7);
  body[offset + 10] = 0x3b;
  return body;
}

function jpegBody(width: number, height: number) {
  const body = Buffer.alloc(24);
  body[0] = 0xff;
  body[1] = 0xd8;
  body[2] = 0xff;
  body[3] = 0xe0;
  body.writeUInt16BE(4, 4);
  body[8] = 0xff;
  body[9] = 0xc0;
  body.writeUInt16BE(11, 10);
  body[12] = 8;
  body.writeUInt16BE(height, 13);
  body.writeUInt16BE(width, 15);
  body[17] = 1;
  return body;
}

function respond(body: Buffer, mime: string) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(new Uint8Array(body), {
      headers: { 'content-type': mime },
    })
  );
}

const signal = () => new AbortController().signal;

function load(body: Buffer, mime: string, maxBytes = MAX_AVATAR_BYTES) {
  respond(body, mime);
  return loadExportAvatar(
    'github:alice',
    signal(),
    maxBytes,
    MAX_EXPORT_AVATAR_PIXELS
  );
}

afterEach(() => vi.restoreAllMocks());
describe('server export avatars', () => {
  it('follows the GitHub avatar redirect and embeds the image', async () => {
    const body = pngBody(2, 3);
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: 'https://avatars.githubusercontent.com/u/2' },
        })
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array(body), {
          headers: { 'content-type': 'image/png' },
        })
      );
    expect(
      await loadExportAvatar(
        'github:alice',
        signal(),
        MAX_AVATAR_BYTES,
        MAX_EXPORT_AVATAR_PIXELS
      )
    ).toEqual({
      dataUri: `data:image/png;base64,${body.toString('base64')}`,
      pixels: 2 * 3,
    });
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
      await loadExportAvatar(
        'github:alice',
        signal(),
        MAX_AVATAR_BYTES,
        MAX_EXPORT_AVATAR_PIXELS
      )
    ).toBe('');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('omits failed avatars without failing the export', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    expect(
      await loadExportAvatar(
        'github:alice',
        signal(),
        MAX_AVATAR_BYTES,
        MAX_EXPORT_AVATAR_PIXELS
      )
    ).toBe('');
  });
  it('omits avatars with unparseable image headers', async () => {
    expect(await load(Buffer.from([1, 2, 3]), 'image/png')).toBe('');
  });
  it('omits a disallowed content type and cancels the body', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')
        );
      },
      cancel() {
        cancelled = true;
      },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(body, { headers: { 'content-type': 'image/svg+xml' } })
    );
    expect(
      await loadExportAvatar(
        'github:alice',
        signal(),
        MAX_AVATAR_BYTES,
        MAX_EXPORT_AVATAR_PIXELS
      )
    ).toBe('');
    expect(cancelled).toBe(true);
  });
  it.each([
    ['png', 'image/png', pngBody(MAX_EXPORT_AVATAR_DIMENSION + 1, 1)],
    ['gif', 'image/gif', gifBody(1, MAX_EXPORT_AVATAR_DIMENSION + 1)],
    ['jpeg', 'image/jpeg', jpegBody(MAX_EXPORT_AVATAR_DIMENSION + 1, 1)],
  ] as [string, string, Buffer][])(
    'omits %s avatars above the dimension cap',
    async (_name, mime, body) => {
      expect(await load(body, mime)).toBe('');
    }
  );
  it.each([
    ['png', 'image/png', pngBody(2000, 600)],
    ['gif', 'image/gif', gifBody(2000, 600)],
    ['jpeg', 'image/jpeg', jpegBody(2000, 600)],
  ] as [string, string, Buffer][])(
    'omits %s avatars above the pixel cap',
    async (_name, mime, body) => {
      expect(2000 * 600).toBeGreaterThan(MAX_EXPORT_AVATAR_PIXELS);
      expect(await load(body, mime)).toBe('');
    }
  );
  it.each([
    ['png', 'image/png', pngBody(64, 64), 64 * 64],
    ['gif', 'image/gif', gifBody(64, 64), 64 * 64],
    ['jpeg', 'image/jpeg', jpegBody(64, 64), 64 * 64],
  ] as [string, string, Buffer, number][])(
    'embeds small %s avatars',
    async (_name, mime, body, pixels) => {
      expect(await load(body, mime)).toEqual({
        dataUri: `data:${mime};base64,${body.toString('base64')}`,
        pixels,
      });
    }
  );
  it.each([
    ['2048x488', pngBody(2048, 488), 2048 * 488],
    ['1000x1000', pngBody(1000, 1000), 1000 * 1000],
  ] as [string, Buffer, number][])(
    'accepts %s at the pixel cap',
    async (_name, body, pixels) => {
      expect(await load(body, 'image/png')).toEqual({
        dataUri: `data:image/png;base64,${body.toString('base64')}`,
        pixels,
      });
    }
  );
  it('omits a 1000x1001 avatar above the pixel cap', async () => {
    expect(await load(pngBody(1000, 1001), 'image/png')).toBe('');
  });
  it('accepts a body whose byte length equals the granted maximum', async () => {
    const body = pngBody(1, 1);
    expect(await load(body, 'image/png', body.byteLength)).toEqual({
      dataUri: `data:image/png;base64,${body.toString('base64')}`,
      pixels: 1,
    });
  });
  it('omits a body one byte above the granted maximum', async () => {
    const body = pngBody(1, 1);
    expect(await load(body, 'image/png', body.byteLength - 1)).toBe('');
  });
  it('cancels the body and omits avatars above the byte limit', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3, 4]));
        controller.enqueue(new Uint8Array([5, 6]));
      },
      cancel() {
        cancelled = true;
      },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(body, { headers: { 'content-type': 'image/png' } })
    );
    expect(
      await loadExportAvatar(
        'github:alice',
        signal(),
        3,
        MAX_EXPORT_AVATAR_PIXELS
      )
    ).toBe('');
    expect(cancelled).toBe(true);
  });
  it('rejects when the request aborts after the first chunk is read', async () => {
    const controller = new AbortController();
    let releaseStall: () => void = () => {};
    const stalled = new Promise<void>((resolve) => {
      releaseStall = resolve;
    });
    const body = new ReadableStream<Uint8Array>({
      start(stream) {
        stream.enqueue(new Uint8Array([0xff]));
      },
      pull(stream) {
        controller.signal.addEventListener('abort', () =>
          stream.error(controller.signal.reason)
        );
        releaseStall();
      },
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(body, { headers: { 'content-type': 'image/png' } })
    );
    const pending = loadExportAvatar(
      'github:alice',
      controller.signal,
      MAX_AVATAR_BYTES,
      MAX_EXPORT_AVATAR_PIXELS
    );
    await stalled;
    controller.abort();
    await expect(pending).rejects.toThrow();
  });
  it('rejects a GIF frame larger than the logical screen', async () => {
    const body = gifBody(64, 64, { width: 3000, height: 3000 });
    expect(await load(body, 'image/gif')).toBe('');
  });
  it('uses the first GIF frame rect instead of the logical screen', async () => {
    const body = gifBody(3000, 3000, { width: 64, height: 64 });
    expect(await load(body, 'image/gif')).toEqual({
      dataUri: `data:image/gif;base64,${body.toString('base64')}`,
      pixels: 64 * 64,
    });
  });
  it('accepts a GIF with a global color table and extension before the frame', async () => {
    const body = gifBody(
      64,
      64,
      { width: 64, height: 64 },
      { extension: true, globalColorTable: true }
    );
    expect(await load(body, 'image/gif')).toEqual({
      dataUri: `data:image/gif;base64,${body.toString('base64')}`,
      pixels: 64 * 64,
    });
  });
  it('omits a GIF with a truncated frame descriptor', async () => {
    expect(await load(gifBody(64, 64).subarray(0, 20), 'image/gif')).toBe('');
  });
  it('omits a GIF without an image frame', async () => {
    const header = Buffer.alloc(14);
    header.write('GIF89a', 0, 'ascii');
    header.writeUInt16LE(64, 6);
    header.writeUInt16LE(64, 8);
    header[13] = 0x3b;
    expect(await load(header, 'image/gif')).toBe('');
  });
  it.each([
    ['zero-length segment', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00])],
    ['truncated SOF', jpegBody(64, 64).subarray(0, 20)],
    ['unterminated fill run', Buffer.from([0xff, 0xd8, 0xff, 0xff, 0xff])],
  ] as [string, Buffer][])('omits a JPEG with a %s', async (_name, body) => {
    expect(await load(body, 'image/jpeg')).toBe('');
  });
});
