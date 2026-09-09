import {
  encodeMessage,
  MessageDecoder,
  StdinStream,
} from '@/public/clangd/lsp-stream.mjs';
import { describe, expect, it, vi } from 'vitest';

describe('clangd byte framing', () => {
  it('keeps header lines and body separate for the patched stdin waits', async () => {
    const input = new StdinStream();
    const message = { id: 1, method: 'initialize', params: { text: '中文🙂' } };
    const awakened = vi.fn();
    const waiting = input.ready().then(awakened);
    await Promise.resolve();
    expect(awakened).not.toHaveBeenCalled();
    input.enqueue(message);
    await waiting;
    const chunks: string[] = [];
    for (let index = 0; index < 3; index++) {
      await input.ready();
      const bytes: number[] = [];
      for (let byte = input.read(); byte !== null; byte = input.read())
        bytes.push(byte);
      chunks.push(new TextDecoder().decode(new Uint8Array(bytes)));
    }
    expect(chunks).toEqual([
      `Content-Length: ${new TextEncoder().encode(JSON.stringify(message)).length}\r\n`,
      '\r\n',
      JSON.stringify(message),
    ]);
    const next = vi.fn();
    const nextMessage = input.ready().then(next);
    await Promise.resolve();
    expect(next).not.toHaveBeenCalled();
    input.enqueue({ id: 2, method: 'initialized' });
    await nextMessage;
    expect(next).toHaveBeenCalledOnce();
  });
  it('roundtrips Unicode and consecutive LSP messages byte by byte', () => {
    const receive = vi.fn();
    const decoder = new MessageDecoder(receive);
    const messages = [
      { jsonrpc: '2.0', id: 1, params: { text: '// 中文🙂\nint main() {}' } },
      { jsonrpc: '2.0', id: 2, result: 'std::vector<int>' },
    ];
    for (const message of messages) {
      for (const byte of encodeMessage(message)) decoder.push(byte);
    }
    expect(receive.mock.calls).toEqual(messages.map((message) => [message]));
  });
  it('rejects malformed or excessive message sizes', () => {
    for (const header of [
      'Content-Length: -1\r\n\r\n',
      'Content-Length: 999999999\r\n\r\n',
    ]) {
      const decoder = new MessageDecoder(vi.fn());
      expect(() => {
        for (const byte of new TextEncoder().encode(header)) decoder.push(byte);
      }).toThrow('Invalid LSP message length');
    }
  });
});
