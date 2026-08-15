import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type { ProblemConfigPageData } from '@/shared/types/problem-config';

export type ProblemConfigResponse = Errorable<ProblemConfigPageData>;

export const getProblemConfig = (pid: string | number) =>
  alova.Get<ProblemConfigResponse>(`/p/${pid}/config`);
