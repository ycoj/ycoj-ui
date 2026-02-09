import { alova } from '@/api/server';
import type { Discussion } from '@/shared/types/discussion';
import type {
  Homework,
  HomeworkProblemStatusDict,
  HomeworkStatus,
} from '@/shared/types/homework';
import type { ProblemDict } from '@/shared/types/problem';
import type { RecordDict } from '@/shared/types/record';
import type { BaseUserDict } from '@/shared/types/user';

export type HomeworkDetailTdoc = Homework & {
  duration: number;
  penaltySince?: Date;
  penaltyRules?: Record<string, number>;
  privateFiles?: { name: string; size: number }[];
  allowViewCode?: boolean;
  allowPrint?: boolean;
  langs?: string[];
};

export type HomeworkDetailResponse = {
  tdoc: HomeworkDetailTdoc;
  tsdoc: HomeworkStatus | null;
  udict: BaseUserDict;
  ddocs: Discussion[];
  page: number;
  dpcount: number;
  dcount: number;
  pdict?: ProblemDict;
  psdict?: HomeworkProblemStatusDict;
  rdict?: RecordDict;
};

export const getHomeworkDetail = (tid: string, page?: number) =>
  alova.Get<HomeworkDetailResponse>(`/homework/${tid}`, {
    params: {
      page,
    },
  });
