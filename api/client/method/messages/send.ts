import { clientRequest } from '@/api/client';
import type { MessageDoc, MessageUser } from '@/shared/types/message';

export type SendMessageResponse = {
  mdoc: MessageDoc;
  udoc: MessageUser;
};

export const sendMessage = (uid: number, content: string) =>
  clientRequest.Post<SendMessageResponse>('/home/messages', {
    operation: 'send',
    uid,
    content,
  });
