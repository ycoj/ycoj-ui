import { alova } from '@/api/server';
import type { Contest, Homework } from '@/shared/types/contest';
import type { ProblemDoc } from '@/shared/types/problem';
import type { RecordDoc } from '@/shared/types/record';
import type { ObjectId } from '@/shared/types/shared';
import type { BaseUserDict } from '@/shared/types/user';

export type RecordListParams = {
  page?: number;
  pid?: number;
  tid?: ObjectId;
  uidOrName?: string;
  lang?: string;
  status?: number;
};

export type RecordListResponse = {
  page: number;
  ppcount?: number;
  rdocs: RecordDoc[];
  tdoc: Contest | Homework | null;
  pdict: Record<number, ProblemDoc>;
  udict: BaseUserDict;
  all: boolean;
  allDomain: boolean;
  filterPid?: string;
  filterTid?: ObjectId;
  filterUidOrName?: string;
  filterLang?: string;
  filterStatus?: number;
  notification: unknown[];
};

export const getList = (params?: RecordListParams) =>
  alova.Get<RecordListResponse>('/record', {
    params,
  });
