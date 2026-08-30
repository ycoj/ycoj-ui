import { alova } from '@/api/server';
import type { Contest, ContestStatus } from '@/shared/types/contest';
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
  alova.Get<ContestSolutionResponse>(`/contest/${tid}/solution/${sid}`);
