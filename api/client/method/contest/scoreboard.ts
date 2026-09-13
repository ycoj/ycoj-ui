import { clientRequest } from '@/api/client';
import { downloadRequest } from '@/api/client/download';
import type { ScoreboardExportOptions } from '@/shared/types/contest';

export const unlockScoreboard = (tid: string) =>
  clientRequest.Post<void>(`/contest/${tid}/scoreboard`, {
    operation: 'unlock',
  });

export const downloadScoreboard = (
  pageType: 'contest' | 'homework',
  tid: string,
  options: ScoreboardExportOptions
) =>
  downloadRequest.Get<Blob>(`/scoreboard-export/${pageType}/${tid}`, {
    params: options,
  });
