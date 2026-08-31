import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';
import type { PasteExpire, PasteMode } from '@/shared/types/paste';

export const createPaste = (
  title: string,
  mode: PasteMode,
  language: string,
  content: string,
  expire: PasteExpire
) =>
  clientRequest.Post<Errorable<{ id: string; url: string }>>('/paste', {
    title,
    mode,
    language: mode === 'markdown' ? '' : language,
    content,
    expire,
  });
