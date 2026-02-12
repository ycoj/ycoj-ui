import { alova } from '@/api/server';
import type { GDoc } from '@/shared/types/contest';
import type {
  ProblemDict,
  ProblemStatus as ProblemStatusDoc,
} from '@/shared/types/problem';
import type {
  StatusDocBase,
  TrainingDoc,
  TrainingNode,
  TrainingNodeStatus,
  TrainingStatusFields,
} from '@/shared/types/training';
import type { BaseUserDict, User } from '@/shared/types/user';

export type TrainingDetailResponse = {
  tdoc: TrainingDoc;
  tsdoc: StatusDocBase & TrainingStatusFields;
  pids: number[];
  pdict: ProblemDict;
  psdict: Record<number, ProblemStatusDoc>;
  ndict: Record<number, TrainingNode>;
  nsdict: Record<number, TrainingNodeStatus>;
  udoc: User;
  udict: BaseUserDict;
  selfPsdict: Record<number, ProblemStatusDoc>;
  groups: GDoc[];
  missing: number[];
};

export const getTrainingDetail = (tid: string, uid?: number) =>
  alova.Get<TrainingDetailResponse>(`/training/${tid}`, {
    params: {
      ...(uid !== undefined ? { uid } : {}),
    },
  });
