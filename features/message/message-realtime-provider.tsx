'use client';

import MessageAlertDialog from './message-alert-dialog';
import { MessageRealtimeContextProvider } from './message-realtime-context';
import { formatMessageContent } from './message-utils';
import { createMessageSocketUrl } from '@/shared/lib/message-socket-url';
import { MessageFlag, type MessageEvent } from '@/shared/types/message';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { toast } from 'sonner';

type CrossTabMessage =
  | { type: 'event'; payload: MessageEvent }
  | { type: 'visible-ack'; id: string }
  | { type: 'read' };

type Props = {
  children: React.ReactNode;
  initialUnread?: number;
  userId: number;
};

const LEASE_MS = 8_000;
const HEARTBEAT_MS = 3_000;

function getCookie(name: string) {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function isMessageEvent(value: unknown): value is MessageEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<MessageEvent>;
  return Boolean(
    event.mdoc && event.udoc && typeof event.mdoc._id === 'string'
  );
}

export default function MessageRealtimeProvider({
  children,
  initialUnread = 0,
  userId,
}: Props) {
  const locale: 'en' | 'zh' = useLocale() === 'zh' ? 'zh' : 'en';
  const t = useTranslations('messages');
  const pathname = usePathname();
  const router = useRouter();
  const listeners = useRef(new Set<(event: MessageEvent) => void>());
  const socket = useRef<ReconnectingWebSocket | null>(null);
  const tabId = useRef('');
  const channel = useRef<BroadcastChannel | null>(null);
  const pendingNotifications = useRef(
    new Map<string, ReturnType<typeof setTimeout>>()
  );
  const [alert, setAlert] = useState<MessageEvent | null>(null);
  const alertContent = alert
    ? formatMessageContent(alert.mdoc, locale).text
    : '';
  const pathnameRef = useRef(pathname);
  const localeRef = useRef(locale);
  const routerRef = useRef(router);
  const tRef = useRef(t);

  useEffect(() => {
    pathnameRef.current = pathname;
    localeRef.current = locale;
    routerRef.current = router;
    tRef.current = t;
  }, [locale, pathname, router, t]);

  const markMessagesRead = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('hydro-messages-read', String(Date.now()));
    channel.current?.postMessage({ type: 'read' } satisfies CrossTabMessage);
  }, []);

  const subscribe = useCallback((listener: (event: MessageEvent) => void) => {
    listeners.current.add(listener);
    return () => listeners.current.delete(listener);
  }, []);

  const dispatchEvent = useCallback((event: MessageEvent) => {
    for (const listener of listeners.current) listener(event);

    const content = formatMessageContent(event.mdoc, localeRef.current);
    const onMessagesPage = pathnameRef.current.startsWith('/home/messages');
    const navigate = () =>
      routerRef.current.push(
        content.url || `/home/messages?uid=${event.udoc._id}`
      );

    if (event.mdoc.flag & MessageFlag.alert) {
      setAlert(event);
      return;
    }
    if (event.mdoc.flag & MessageFlag.info) {
      toast.info(content.text, { duration: 3_000 });
      return;
    }
    if (!onMessagesPage && !document.hidden) {
      channel.current?.postMessage({ type: 'visible-ack', id: event.mdoc._id });
      toast(
        event.udoc._id === 1 && event.mdoc.flag & MessageFlag.richtext
          ? tRef.current('systemMessage')
          : content.text,
        {
          description: event.udoc._id === 1 ? undefined : event.udoc.uname,
          duration: 15_000,
          action: { label: tRef.current('open'), onClick: navigate },
        }
      );
    }
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/home/messages') || !initialUnread) return;
    const storageKey = `hydro-messages-initial-unread-${userId}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, '1');
    toast.info(t('initialUnread', { count: initialUnread }), {
      duration: 5_000,
      action: {
        label: t('open'),
        onClick: () => router.push('/home/messages'),
      },
    });
  }, [initialUnread, pathname, router, t, userId]);

  useEffect(() => {
    if (!('BroadcastChannel' in window)) return;
    const channelName = `hydro-messages-${userId}`;
    const leaderKey = `hydro-messages-leader-${userId}`;
    const id =
      tabId.current ||
      (crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`);
    tabId.current = id;
    const broadcast = new BroadcastChannel(channelName);
    channel.current = broadcast;
    let leader = false;
    const notificationTimers = pendingNotifications.current;

    const closeSocket = () => {
      socket.current?.close();
      socket.current = null;
    };
    const acquireLease = () => {
      const now = Date.now();
      try {
        const raw = localStorage.getItem(leaderKey);
        const existing = raw
          ? (JSON.parse(raw) as { id?: string; expiresAt?: number })
          : null;
        if (existing?.id !== id && (existing?.expiresAt ?? 0) > now)
          return false;
        localStorage.setItem(
          leaderKey,
          JSON.stringify({ id, expiresAt: now + LEASE_MS })
        );
        return true;
      } catch {
        return false;
      }
    };
    const sendNativeNotification = (event: MessageEvent) => {
      if (Notification.permission !== 'granted') return;
      const content = formatMessageContent(event.mdoc, localeRef.current);
      const notification = new Notification(
        event.udoc._id === 1 ? content.text.split('\n')[0] : event.udoc.uname,
        {
          body:
            event.udoc._id === 1
              ? content.text.split('\n').slice(1).join('\n')
              : content.text,
          icon:
            content.avatar ||
            event.udoc.avatarUrl ||
            '/android-chrome-192x192.png',
          tag: `message-${event.mdoc._id}`,
        }
      );
      notification.onclick = () => {
        window.focus();
        routerRef.current.push(
          content.url || `/home/messages?uid=${event.udoc._id}`
        );
      };
    };
    const scheduleNativeNotification = (event: MessageEvent) => {
      if (event.mdoc.flag & (MessageFlag.info | MessageFlag.alert)) return;
      const timer = setTimeout(() => {
        notificationTimers.delete(event.mdoc._id);
        sendNativeNotification(event);
      }, 3_000);
      notificationTimers.set(event.mdoc._id, timer);
    };
    const becomeLeader = () => {
      if (leader || !acquireLease()) return;
      leader = true;
      const url = createMessageSocketUrl();
      if (!url) return;
      const connection = new ReconnectingWebSocket(url, [], {
        maxReconnectionDelay: 10_000,
        maxRetries: 100,
      });
      socket.current = connection;
      connection.onopen = () => {
        const credential = getCookie('sid');
        connection.send(
          JSON.stringify({
            operation: 'subscribe',
            request_id: id,
            credential,
            channels: ['message'],
          })
        );
      };
      connection.onmessage = (socketEvent) => {
        if (socketEvent.data === 'ping') {
          connection.send('pong');
          return;
        }
        if (socketEvent.data === 'pong' || typeof socketEvent.data !== 'string')
          return;
        try {
          const payload: unknown = JSON.parse(socketEvent.data);
          if (
            payload &&
            typeof payload === 'object' &&
            'operation' in payload &&
            payload.operation === 'event' &&
            'payload' in payload &&
            isMessageEvent(payload.payload)
          ) {
            const event = payload.payload;
            broadcast.postMessage({
              type: 'event',
              payload: event,
            } satisfies CrossTabMessage);
            dispatchEvent(event);
            if (document.hidden) scheduleNativeNotification(event);
          }
        } catch {
          // Ignore malformed frames and continue the persistent connection.
        }
      };
    };

    broadcast.onmessage = ({
      data,
    }: globalThis.MessageEvent<CrossTabMessage>) => {
      if (!data || typeof data !== 'object') return;
      if (data.type === 'event') dispatchEvent(data.payload);
      if (data.type === 'visible-ack') {
        const timer = notificationTimers.get(data.id);
        if (timer) {
          clearTimeout(timer);
          notificationTimers.delete(data.id);
        }
      }
    };
    const heartbeat = setInterval(() => {
      if (!leader) {
        becomeLeader();
        return;
      }
      if (!acquireLease()) {
        leader = false;
        closeSocket();
      }
    }, HEARTBEAT_MS);
    becomeLeader();

    return () => {
      clearInterval(heartbeat);
      closeSocket();
      for (const timer of notificationTimers.values()) clearTimeout(timer);
      notificationTimers.clear();
      if (leader) {
        const raw = localStorage.getItem(leaderKey);
        if (raw?.includes(id)) localStorage.removeItem(leaderKey);
      }
      broadcast.close();
      if (channel.current === broadcast) channel.current = null;
    };
  }, [dispatchEvent, userId]);

  const contextValue = useMemo(
    () => ({ subscribe, markMessagesRead }),
    [markMessagesRead, subscribe]
  );

  return (
    <MessageRealtimeContextProvider value={contextValue}>
      {children}
      <MessageAlertDialog
        event={alert}
        content={alertContent}
        onClose={() => setAlert(null)}
      />
    </MessageRealtimeContextProvider>
  );
}
