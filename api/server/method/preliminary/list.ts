import { alova } from '@/api/server';
import type {
  PreliminaryAttemptSummary,
  PreliminaryPaperSummary,
} from '@/shared/types/preliminary';

export type PreliminaryListView = 'papers' | 'attempts';

export type PreliminaryListResponse =
  | {
      view: 'papers';
      papers: PreliminaryPaperSummary[];
      page: number;
      pcount: number;
      q: string;
    }
  | {
      view: 'attempts';
      attempts: PreliminaryAttemptSummary[];
      page: number;
      pcount: number;
      q: string;
    };

export const getPreliminaryList = (
  page?: number,
  q?: string,
  view?: PreliminaryListView
) =>
  alova.Get<PreliminaryListResponse>('/preliminary', {
    params: {
      page,
      q,
      view,
    },
  });
