import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type {
  ProblemFilesData,
  ProblemFileType,
} from '@/shared/types/problem-file';
import type { ObjectId } from '@/shared/types/shared';

export type ProblemFilesResponse = Errorable<ProblemFilesData>;

export const getProblemFiles = (
  pid: string | number,
  types?: ProblemFileType[],
  sidebar = false,
  tid?: ObjectId
) =>
  alova.Get<ProblemFilesResponse>(`/p/${pid}/files`, {
    params: {
      d: types,
      sidebar,
      tid,
    },
  });
