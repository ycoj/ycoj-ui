import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';
import type { PasteExpire, PasteMode } from '@/shared/types/paste';

export type CreatePasteRequest = {
  title: string;
  mode: PasteMode;
  language: string;
  content: string;
  expire: PasteExpire;
};

export const createPaste = (payload: CreatePasteRequest) =>
  clientRequest.Post<Errorable<{ id: string }>>('/paste', payload);
