import { alova } from '@/api/server';
import type {
  ContestListProjection,
  ContestStatusDict,
} from '@/shared/types/contest';

export type ContestListResponse = {
  page: number;
  tpcount: number;
  qs: string;
  rule: string | null;
  tdocs: ContestListProjection[];
  tsdict: ContestStatusDict;
  groups: string[];
  group: string | null;
  q: string;
};

export const getContestList = (
  rule?: string,
  group?: string,
  page?: number,
  q?: string
) =>
  alova.Get<ContestListResponse>('/contest', {
    params: {
      rule,
      group,
      page,
      q,
    },
  });
