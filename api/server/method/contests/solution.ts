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

export type ContestSolutionListItem = Pick<
  ContestSolution,
  'docId' | 'title' | 'owner'
>;

export type ContestSolutionData = {
  tdoc: Contest;
  tsdoc: ContestStatus | null;
  csdoc: ContestSolution;
  canManage: boolean;
  udict: BaseUserDict;
};

export type ContestSolutionResponse = Errorable<ContestSolutionData>;

export const getContestSolution = (tid: string, sid: string) =>
  alova.Get<ContestSolutionResponse>(`/contest/${tid}/solution/${sid}`);

export type ContestSolutionCreateData = {
  tdoc: Contest;
  tsdoc: ContestStatus | null;
  canManage: true;
};

export type ContestSolutionCreateResponse =
  Errorable<ContestSolutionCreateData>;

export const getContestSolutionCreate = (tid: string) =>
  alova.Get<ContestSolutionCreateResponse>(`/contest/${tid}/solution/create`);

export type ContestSolutionEditData = {
  tdoc: Contest;
  tsdoc: ContestStatus | null;
  csdoc: ContestSolution;
  canManage: true;
};

export type ContestSolutionEditResponse = Errorable<ContestSolutionEditData>;

export const getContestSolutionEdit = (tid: string, sid: string) =>
  alova.Get<ContestSolutionEditResponse>(
    `/contest/${tid}/solution/${sid}/edit`
  );
