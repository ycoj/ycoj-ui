'use client';

import type { MessageEvent } from '@/shared/types/message';
import { createContext, useContext } from 'react';

type MessageRealtimeContextValue = {
  subscribe: (listener: (event: MessageEvent) => void) => () => void;
  markMessagesRead: () => void;
};

const MessageRealtimeContext =
  createContext<MessageRealtimeContextValue | null>(null);

export function MessageRealtimeContextProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: MessageRealtimeContextValue;
}) {
  return (
    <MessageRealtimeContext.Provider value={value}>
      {children}
    </MessageRealtimeContext.Provider>
  );
}

export function useMessageRealtime() {
  return useContext(MessageRealtimeContext);
}
