import { useRecordSocket } from './use-record-socket';
import { act } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

type Handler<T = unknown> = ((event: T) => void) | null;

const socketMock = vi.hoisted(() => {
  class MockReconnectingWebSocket {
    static instances: MockReconnectingWebSocket[] = [];

    url: string;
    sent: string[] = [];
    close = vi.fn();
    reconnect = vi.fn();
    onopen: Handler = null;
    onmessage: Handler<{ data: unknown }> = null;
    onclose: Handler<{ code: number }> = null;

    constructor(url: string) {
      this.url = url;
      MockReconnectingWebSocket.instances.push(this);
    }

    send(data: string) {
      this.sent.push(data);
    }

    open() {
      this.onopen?.({});
    }

    message(data: unknown) {
      this.onmessage?.({ data });
    }

    closed(code: number) {
      this.onclose?.({ code });
    }
  }

  return { MockReconnectingWebSocket };
});

vi.mock('reconnecting-websocket', () => ({
  default: socketMock.MockReconnectingWebSocket,
}));

const lastSocket = () => socketMock.MockReconnectingWebSocket.instances.at(-1)!;

const processEnv = (
  globalThis as typeof globalThis & {
    process: { env: Record<string, string | undefined> };
  }
).process.env;

function setSocketBaseUrl(value: string) {
  processEnv.NEXT_PUBLIC_WEBSOCKET_BASEURL = value;
}

beforeEach(() => {
  socketMock.MockReconnectingWebSocket.instances = [];
  setSocketBaseUrl('wss://oj.example.com/');
  vi.useFakeTimers();
});

afterEach(() => {
  delete processEnv.NEXT_PUBLIC_WEBSOCKET_BASEURL;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test('connects, reports opens, and delivers JSON messages', async () => {
  const onOpen = vi.fn();
  const onMessage = vi.fn();
  await renderHook(() =>
    useRecordSocket({
      path: '/record-conn',
      params: { domainId: 'system' },
      onOpen,
      onMessage,
    })
  );

  act(() => lastSocket().open());
  expect(onOpen).toHaveBeenCalledOnce();
  act(() => onOpen.mock.calls[0][0]('calibrate'));
  expect(lastSocket().sent).toContain('calibrate');

  act(() => lastSocket().message('{"rdoc":{"_id":"x"}}'));
  expect(onMessage).toHaveBeenCalledWith({ rdoc: { _id: 'x' } });
});

test('handles heartbeats and ignores malformed or error frames', async () => {
  const onMessage = vi.fn();
  await renderHook(() =>
    useRecordSocket({
      path: '/record-conn',
      params: {},
      onMessage,
    })
  );
  act(() => lastSocket().open());

  act(() => lastSocket().message('ping'));
  expect(lastSocket().sent).toContain('pong');
  act(() => lastSocket().message('pong'));
  act(() => lastSocket().message('not-json'));
  act(() => lastSocket().message('{"error":{"name":"PermissionError"}}'));
  expect(onMessage).not.toHaveBeenCalled();

  act(() => vi.advanceTimersByTime(60_000));
  expect(lastSocket().sent.filter((data) => data === 'ping')).toHaveLength(2);
});

test('stops reconnecting for backend business close codes', async () => {
  await renderHook(() =>
    useRecordSocket({
      path: '/record-detail-conn',
      params: { rid: 'x' },
      onMessage: vi.fn(),
    })
  );
  act(() => lastSocket().open());

  act(() => lastSocket().closed(4001));
  expect(lastSocket().close).toHaveBeenCalledOnce();
});

test('reopens the connection on demand via reconnect', async () => {
  const { result } = await renderHook(() =>
    useRecordSocket({
      path: '/record-detail-conn',
      params: { rid: 'x' },
      onMessage: vi.fn(),
    })
  );

  act(() => result.current.reconnect());
  expect(lastSocket().reconnect).toHaveBeenCalledOnce();
});

test('ignores reconnect calls when no socket is connected', async () => {
  setSocketBaseUrl('');
  const { result } = await renderHook(() =>
    useRecordSocket({
      path: '/record-conn',
      params: {},
      onMessage: vi.fn(),
    })
  );

  expect(() => act(() => result.current.reconnect())).not.toThrow();
});

test('closes the socket and heartbeat on unmount', async () => {
  const { unmount } = await renderHook(() =>
    useRecordSocket({
      path: '/record-conn',
      params: {},
      onMessage: vi.fn(),
    })
  );
  act(() => lastSocket().open());
  const socket = lastSocket();

  await unmount();
  expect(socket.close).toHaveBeenCalledOnce();
  act(() => vi.advanceTimersByTime(120_000));
  expect(socket.sent).not.toContain('ping');
});

test('does not create a socket without a configured base URL', async () => {
  setSocketBaseUrl('');
  await renderHook(() =>
    useRecordSocket({
      path: '/record-conn',
      params: {},
      onMessage: vi.fn(),
    })
  );

  expect(socketMock.MockReconnectingWebSocket.instances).toHaveLength(0);
});
