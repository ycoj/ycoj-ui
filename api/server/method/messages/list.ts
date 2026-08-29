import { alova } from '@/api/server';
import type { MessagesResponse } from '@/shared/types/message';

export const getMessages = () => alova.Get<MessagesResponse>('/home/messages');
