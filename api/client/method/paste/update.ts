import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';
import type { PasteExpire, PasteMode } from '@/shared/types/paste';

export const updatePaste = (
  id: string,
  title: string,
  mode: PasteMode,
  language: string,
  content: string,
  expire: PasteExpire
) =>
  clientRequest.Post<Errorable<{ url: string }>>(
    `/paste/${encodeURIComponent(id)}/edit`,
    {
      operation: 'update',
      id,
      title,
      mode,
      language: mode === 'markdown' ? '' : language,
      content,
      expire,
    }
  );
