import { clientRequest } from '@/api/client';
import type { Errorable } from '@/shared/types/error';

export type RecordRejudgeRequest = {
  operation: 'rejudge';
};

export type RecordRejudgeResponse = Errorable<Record<string, never>>;

export const RejudgeRecord = (rid: string) =>
  clientRequest.Post<RecordRejudgeResponse>(`/record/${rid}`, {
    operation: 'rejudge',
  });
