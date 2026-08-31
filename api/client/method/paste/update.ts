import type { CreatePasteRequest } from './create';
import { clientRequest } from '@/api/client';
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
