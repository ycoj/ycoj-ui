import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type { Homework } from '@/shared/types/homework';

export type HomeworkEditTdoc = Homework;

export type HomeworkEditData = {
  tdoc: HomeworkEditTdoc;
  dateBeginText: string;
  timeBeginText: string;
  datePenaltyText: string;
  timePenaltyText: string;
  extensionDays: number;
  penaltyRules: string | null;
  pids: string;
  page_name: string;
};

export type HomeworkEditResponse = Errorable<HomeworkEditData>;

export const getHomeworkEdit = (tid: string) =>
  alova.Get<HomeworkEditResponse>(`/homework/${tid}/edit`);
