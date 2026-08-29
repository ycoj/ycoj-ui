import { alova } from '@/api/server';
import type { Contest, ContestStatus } from '@/shared/types/contest';
import type { ProblemDict } from '@/shared/types/problem';
import type { BaseUser } from '@/shared/types/user';

export type ContestBulkSubmitResponse = {
  tdoc: Contest;
  tsdoc: ContestStatus | null;
  owner_udoc: BaseUser;
  pdict: ProblemDict;
  langRange: Record<string, string>;
  defaultLang: string;
  mappingDefaults: Record<number, string>;
};

export const getContestBulkSubmit = (tid: string) =>
  alova.Get<ContestBulkSubmitResponse>(`/contest/${tid}/bulk-submit`);
