import { alova } from '@/api/server';
import type { Contest } from '@/shared/types/contest';
import type { FileInfo } from '@/shared/types/file';
import type { Homework } from '@/shared/types/homework';
import type { BaseUserDict } from '@/shared/types/user';

export type ContestDetailTdoc = Contest | Homework;

export type ContestDetailStatus = {
  attend: number;
  subscribe: number;
  startAt: Date;
  endAt?: Date;
};

export type ContestDetailResponse = {
  tdoc: ContestDetailTdoc;
  tsdoc: ContestDetailStatus | null;
  udict: BaseUserDict;
  /** Private attachments returned after the user attends and the contest starts. */
  files: FileInfo[];
};

export const getContestDetail = (tid: string) =>
  alova.Get<ContestDetailResponse>(`/contest/${tid}`);
