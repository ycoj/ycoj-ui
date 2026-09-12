import { clientRequest } from '@/api/client';
import { downloadRequest } from '@/api/client/download';

export const unlockScoreboard = (tid: string) =>
  clientRequest.Post<void>(`/contest/${tid}/scoreboard`, {
    operation: 'unlock',
  });

export const downloadScoreboard = (
  pageType: 'contest' | 'homework',
  tid: string,
  options: { avatar: boolean; realName: boolean; details: boolean }
) =>
  downloadRequest.Get<Blob>(`/scoreboard-export/${pageType}/${tid}`, {
    params: options,
  });
