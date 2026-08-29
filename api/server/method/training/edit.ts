import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type { TrainingDoc } from '@/shared/types/training';

export type TrainingEditData = {
  tdoc: TrainingDoc;
  dag: string;
  page_name: string;
};

export type TrainingEditResponse = Errorable<TrainingEditData>;

export const getTrainingEdit = (tid: string) =>
  alova.Get<TrainingEditResponse>(`/training/${tid}/edit`);
