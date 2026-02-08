import { alova } from '@/api/server';
import type {
  ContestListProjection,
  ContestStatusDict,
} from '@/shared/types/contest';

export type HomeworkListResponse = {
  page: number;
  tpcount: number;
  qs: string;
  tdocs: ContestListProjection[];
  hsdict: ContestStatusDict;
  calendar: ContestListProjection[];
  groups: string[];
  group: string | null;
  q: string;
};

export const getHomeworkList = (group?: string, page?: number, q?: string) =>
  alova.Get<HomeworkListResponse>('/homework', {
    params: {
      group,
      page,
      q,
    },
  });
