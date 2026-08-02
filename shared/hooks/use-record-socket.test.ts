import { useRecordSocket } from './use-record-socket';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

beforeEach(() => {
  socketMock.MockReconnectingWebSocket.instances = [];
  vi.stubEnv('NEXT_PUBLIC_WEBSOCKET_BASEURL', 'wss://oj.example.com/');
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useRecordSocket', () => {
  it('connects, reports opens, and delivers JSON messages', () => {
    const onOpen = vi.fn();
    const onMessage = vi.fn();
    renderHook(() =>
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

  it('handles heartbeats and ignores malformed or error frames', () => {
    const onMessage = vi.fn();
    renderHook(() =>
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

  it('stops reconnecting for backend business close codes', () => {
    renderHook(() =>
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

  it('reopens the connection on demand via reconnect', () => {
    const { result } = renderHook(() =>
      useRecordSocket({
        path: '/record-detail-conn',
        params: { rid: 'x' },
        onMessage: vi.fn(),
      })
    );

    act(() => result.current.reconnect());
    expect(lastSocket().reconnect).toHaveBeenCalledOnce();
  });

  it('ignores reconnect calls when no socket is connected', () => {
    vi.stubEnv('NEXT_PUBLIC_WEBSOCKET_BASEURL', '');
    const { result } = renderHook(() =>
      useRecordSocket({
        path: '/record-conn',
        params: {},
        onMessage: vi.fn(),
      })
    );

    expect(() => act(() => result.current.reconnect())).not.toThrow();
  });

  it('closes the socket and heartbeat on unmount', () => {
    const { unmount } = renderHook(() =>
      useRecordSocket({
        path: '/record-conn',
        params: {},
        onMessage: vi.fn(),
      })
    );
    act(() => lastSocket().open());
    const socket = lastSocket();

    unmount();
    expect(socket.close).toHaveBeenCalledOnce();
    act(() => vi.advanceTimersByTime(120_000));
    expect(socket.sent).not.toContain('ping');
  });

  it('does not create a socket without a configured base URL', () => {
    vi.stubEnv('NEXT_PUBLIC_WEBSOCKET_BASEURL', '');
    renderHook(() =>
      useRecordSocket({
        path: '/record-conn',
        params: {},
        onMessage: vi.fn(),
      })
    );

    expect(socketMock.MockReconnectingWebSocket.instances).toHaveLength(0);
  });
});
