import { alova } from '@/api/server';
import type { Contest, ContestStatus } from '@/shared/types/contest';
import type { Errorable } from '@/shared/types/error';
import type { BaseUserDict } from '@/shared/types/user';

export type ContestSolution = {
  _id: string;
  docId: string;
  owner: number;
  parentId: string;
  title: string;
  content: string;
};

export type ContestSolutionResponse = {
  tdoc: Contest;
  tsdoc: ContestStatus | null;
  csdoc: ContestSolution;
  canManage: boolean;
  udict: BaseUserDict;
};

export const getContestSolution = (tid: string, sid: string) =>
  alova.Get<Errorable<ContestSolutionResponse>>(
    `/contest/${tid}/solution/${sid}`
  );

export type ContestSolutionEditResponse = {
  tdoc: Contest;
  tsdoc: ContestStatus | null;
  csdoc: ContestSolution | Record<string, never>;
  canManage: boolean;
};

export const getContestSolutionEdit = (tid: string, sid?: string) =>
  alova.Get<Errorable<ContestSolutionEditResponse>>(
    sid
      ? `/contest/${tid}/solution/${sid}/edit`
      : `/contest/${tid}/solution/create`
  );
