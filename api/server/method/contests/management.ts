import { alova } from '@/api/server';
import type { Contest, ContestStatus } from '@/shared/types/contest';
import type { FileInfo } from '@/shared/types/file';
import type { ProblemDict } from '@/shared/types/problem';
import type { BaseUser, BaseUserDict } from '@/shared/types/user';

export type ContestManagementResponse = {
  tdoc: Contest;
  tsdoc: ContestStatus | null;
  owner_udoc: BaseUser;
  pdict: ProblemDict;
  files: FileInfo[];
  privateFiles: FileInfo[];
};

export const getContestManagement = (
  tid: string,
  d?: 'public' | 'private',
  sidebar?: boolean
) =>
  alova.Get<ContestManagementResponse>(`/contest/${tid}/management`, {
    params: {
      ...(d ? { d } : {}),
      ...(sidebar === undefined ? {} : { sidebar }),
    },
  });

export type ContestClarificationResponse = ContestManagementResponse & {
  tcdocs: import('@/shared/types/contest').ContestClarificationDoc[];
  udict: BaseUserDict;
};

export const getContestClarifications = (tid: string) =>
  alova.Get<ContestClarificationResponse>(`/contest/${tid}/clarification`);

export type ContestUserStatus = ContestStatus & {
  uid: number;
  unrank?: boolean;
};
export type ContestUsersResponse = {
  tdoc: Contest;
  tsdocs: ContestUserStatus[];
  udict: BaseUserDict;
};

export const getContestUsers = (tid: string) =>
  alova.Get<ContestUsersResponse>(`/contest/${tid}/user`);

export type ContestBalloon = {
  _id: string;
  uid: number;
  pid: number;
  first?: boolean;
  sent?: number;
  sentAt?: Date;
};
export type ContestBalloonsResponse = ContestManagementResponse & {
  bdocs: ContestBalloon[];
  udict: BaseUserDict;
};

export const getContestBalloons = (tid: string, todo?: boolean) =>
  alova.Get<ContestBalloonsResponse>(`/contest/${tid}/balloon`, {
    params: todo ? { todo: true } : {},
  });
