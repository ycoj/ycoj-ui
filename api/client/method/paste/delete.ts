import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';

export const deletePaste = (id: string) =>
  clientRequest.Post<Errorable<{ url?: string }>>(
    `/paste/${encodeURIComponent(id)}/edit`,
    {
      operation: 'delete',
      id,
    }
  );
