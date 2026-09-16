import { createMessageSocketUrl } from './message-socket-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  document.cookie = 'sid=; Max-Age=0; Path=/';
});

describe('createMessageSocketUrl', () => {
  it('uses the shared websocket endpoint and passes sid across origins', () => {
    vi.stubEnv('NEXT_PUBLIC_WEBSOCKET_BASEURL', 'https://socket.example.test');
    document.cookie = 'sid=message-session; Path=/';

    const url = new URL(createMessageSocketUrl() ?? '');

    expect(url.protocol).toBe('wss:');
    expect(url.pathname).toBe('/websocket');
    expect(url.searchParams.get('sid')).toBe('message-session');
  });

  it('returns null without a configured websocket base URL', () => {
    vi.stubEnv('NEXT_PUBLIC_WEBSOCKET_BASEURL', '');

    expect(createMessageSocketUrl()).toBeNull();
  });
});
