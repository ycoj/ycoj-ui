import type { ContestSolutionListItem } from './solution';
import { alova } from '@/api/server';
import type { Contest, ContestStatus } from '@/shared/types/contest';
import type { Errorable } from '@/shared/types/error';
import type { FileInfo } from '@/shared/types/file';
import type { Homework } from '@/shared/types/homework';
import type { BaseUserDict } from '@/shared/types/user';

export type ContestDetailTdoc = Contest | Homework;

export type ContestDetailStatus = ContestStatus;

export type ContestDetailData = {
  /**
   * The backend omits the field when solutions are unavailable to the viewer.
   */
  csdocs?: ContestSolutionListItem[];
  /**
   * Absence is legitimate: when omitted, consumers must fail safe and treat
   * the solutions section as hidden.
   */
  showContestSolutions?: boolean;
  /**
   * Absence is legitimate: when omitted, consumers must fail safe and treat
   * the viewer as a reader without management controls.
   */
  canManage?: boolean;
  tdoc: ContestDetailTdoc;
  tsdoc: ContestDetailStatus | null;
  udict: BaseUserDict;
  /** Private attachments returned after the user attends and the contest starts. */
  files: FileInfo[];
};

export type ContestDetailResponse = Errorable<ContestDetailData>;

export const getContestDetail = (tid: string) =>
  alova.Get<ContestDetailResponse>(`/contest/${tid}`);
