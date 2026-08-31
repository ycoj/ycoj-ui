import { clientRequest } from '@/api/client';
import type { CreatePasteRequest } from '@/api/client/method/paste/create';
import type { Errorable } from '@/shared/types/error';

export const updatePaste = (id: string, payload: CreatePasteRequest) =>
  clientRequest.Post<Errorable<{ url?: string }>>(
    `/paste/${encodeURIComponent(id)}/edit`,
    {
      operation: 'update',
      id,
      ...payload,
    }
  );
