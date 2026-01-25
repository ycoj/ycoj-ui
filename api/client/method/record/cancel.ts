import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';

export type RecordCancelRequest = {
  operation: 'cancel';
};

export type RecordCancelResponse = Errorable<Record<string, never>>;

export const CancelRecord = (rid: string) =>
  clientRequest.Post<RecordCancelResponse>(`/record/${rid}`, {
    operation: 'cancel',
  });
