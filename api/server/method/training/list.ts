import { alova } from '@/api/server';
import type {
  TrainingDict,
  TrainingDoc,
  TrainingStatusDict,
} from '@/shared/types/training';

export type TrainingListResponse = {
  tdocs: TrainingDoc[];
  page: number;
  tpcount: number;
  tsdict?: TrainingStatusDict;
  tdict?: TrainingDict;
  q: string;
};

export const getTrainingList = (page?: number, q?: string) =>
  alova.Get<TrainingListResponse>('/training', {
    params: {
      page,
      q,
    },
  });
