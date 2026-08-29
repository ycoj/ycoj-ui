import { alova } from '@/api/server';
import type { Contest } from '@/shared/types/contest';
import type { Errorable } from '@/shared/types/error';

export type ContestEditTdoc = Contest;

export type ContestEditData = {
  tdoc: ContestEditTdoc;
  duration: number;
  pids: string;
  page_name: string;
};

export type ContestEditResponse = Errorable<ContestEditData>;

export const getContestEdit = (tid: string) =>
  alova.Get<ContestEditResponse>(`/contest/${tid}/edit`);
