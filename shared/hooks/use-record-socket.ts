import {
  createRecordSocketUrl,
  type RecordSocketPath,
  type SocketUrlParams,
} from '@/shared/lib/socket-url';
import { useCallback, useEffect, useRef } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';

type Props = {
  path: RecordSocketPath;
  params: SocketUrlParams;
  onOpen?: (send: (data: string) => void) => void;
  onMessage: (message: unknown) => void;
};

const HEARTBEAT_INTERVAL_MS = 30_000;

export function useRecordSocket({ path, params, onOpen, onMessage }: Props) {
  const onOpenRef = useRef(onOpen);
  const onMessageRef = useRef(onMessage);
  const socketRef = useRef<ReconnectingWebSocket | null>(null);

  useEffect(() => {
    onOpenRef.current = onOpen;
    onMessageRef.current = onMessage;
  }, [onMessage, onOpen]);

  const url = createRecordSocketUrl(path, params);

  useEffect(() => {
    if (!url) return;

    const socket = new ReconnectingWebSocket(url, [], {
      maxReconnectionDelay: 10_000,
      maxRetries: 100,
    });
    socketRef.current = socket;
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    socket.onopen = () => {
      if (heartbeat) clearInterval(heartbeat);
      heartbeat = setInterval(() => socket.send('ping'), HEARTBEAT_INTERVAL_MS);
      onOpenRef.current?.((data) => socket.send(data));
    };

    socket.onmessage = (event) => {
      if (event.data === 'ping') {
        socket.send('pong');
        return;
      }
      if (event.data === 'pong' || typeof event.data !== 'string') return;

      try {
        const message: unknown = JSON.parse(event.data);
        if (message && typeof message === 'object' && 'error' in message) {
          return;
        }
        onMessageRef.current(message);
      } catch {
        // Ignore malformed frames; the next valid update can still be applied.
      }
    };

    socket.onclose = (event) => {
      if (heartbeat) clearInterval(heartbeat);
      if (event.code >= 4000) socket.close();
    };

    return () => {
      socketRef.current = null;
      if (heartbeat) clearInterval(heartbeat);
      socket.close();
    };
  }, [url]);

  const reconnect = useCallback(() => {
    socketRef.current?.reconnect();
  }, []);

  return { reconnect };
}
