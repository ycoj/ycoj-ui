import { clientRequest } from '@/api/client';

export const unlockScoreboard = (tid: string) =>
  clientRequest.Post<void>(`/contest/${tid}/scoreboard`, {
    operation: 'unlock',
  });
