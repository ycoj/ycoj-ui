import { createMessageSocketUrl } from './message-socket-url';
import { afterEach, expect, test } from 'vitest';

const processEnv = (
  globalThis as typeof globalThis & {
    process: { env: Record<string, string | undefined> };
  }
).process.env;

afterEach(() => {
  document.cookie = 'sid=; Max-Age=0; Path=/';
  delete processEnv.NEXT_PUBLIC_WEBSOCKET_BASEURL;
});

test('uses the shared websocket endpoint and passes sid across origins', () => {
  processEnv.NEXT_PUBLIC_WEBSOCKET_BASEURL = 'https://socket.example.test';
  document.cookie = 'sid=message-session; Path=/';

  const url = new URL(createMessageSocketUrl() ?? '');

  expect(url.protocol).toBe('wss:');
  expect(url.pathname).toBe('/websocket');
  expect(url.searchParams.get('sid')).toBe('message-session');
});

test('returns null without a configured websocket base URL', () => {
  processEnv.NEXT_PUBLIC_WEBSOCKET_BASEURL = '';

  expect(createMessageSocketUrl()).toBeNull();
});
