/** Encode byte lengths, including non-ASCII source code, for clangd's stdin. */
export function encodeMessage(message) {
  const body = new TextEncoder().encode(JSON.stringify(message));
  const header = new TextEncoder().encode(
    `Content-Length: ${body.length}\r\n\r\n`
  );
  const bytes = new Uint8Array(header.length + body.length);
  bytes.set(header);
  bytes.set(body, header.length);
  return bytes;
}

/** The patched transport waits before each header line and body read. Keep
 * these chunks separate so stdio cannot read ahead and then wait on an empty queue. */
export class StdinStream {
  chunks = [];
  current = null;
  offset = 0;
  wake = () => {};

  enqueue(message) {
    const body = new TextEncoder().encode(JSON.stringify(message));
    this.chunks.push(
      new TextEncoder().encode(`Content-Length: ${body.length}\r\n`),
      new TextEncoder().encode('\r\n'),
      body
    );
    this.wake();
  }

  async ready() {
    if (!this.chunks.length)
      await new Promise((resolve) => {
        this.wake = resolve;
      });
  }

  read() {
    if (!this.current) {
      this.current = this.chunks.shift() ?? null;
      this.offset = 0;
    }
    if (!this.current) return null;
    if (this.offset === this.current.length) {
      this.current = null;
      return null;
    }
    return this.current[this.offset++];
  }
}

/** clangd stdout may split a UTF-8 character or a frame across callbacks. */
export class MessageDecoder {
  header = '';
  body = new Uint8Array(0);
  offset = 0;

  constructor(onMessage) {
    this.onMessage = onMessage;
  }

  push(byte) {
    if (this.body.length) {
      this.body[this.offset++] = byte;
      if (this.offset === this.body.length) {
        const message = JSON.parse(new TextDecoder().decode(this.body));
        this.body = new Uint8Array(0);
        this.offset = 0;
        this.onMessage(message);
      }
      return;
    }
    this.header += String.fromCharCode(byte);
    if (this.header.length > 8192) throw new Error('Invalid LSP header');
    if (!this.header.endsWith('\r\n\r\n')) return;
    const length = Number(
      /^Content-Length: (\d+)\r\n/im.exec(this.header)?.[1]
    );
    if (
      !Number.isSafeInteger(length) ||
      length <= 0 ||
      length > 16 * 1024 * 1024
    ) {
      throw new Error('Invalid LSP message length');
    }
    this.body = new Uint8Array(length);
    this.header = '';
  }
}
