import { alova } from '@/api/server';
import type { Errorable } from '@/shared/types/error';
import type {
  ProblemFilesData,
  ProblemFileType,
} from '@/shared/types/problem-file';
import type { ObjectId } from '@/shared/types/shared';

export type ProblemFilesResponse = Errorable<ProblemFilesData>;

/**
 * Fetches both file collections for a problem.
 *
 * @param types Legacy view fragments to render. This does not filter the JSON
 * response, which always includes both collections.
 * @param sidebar Whether the legacy view should omit the problem sidebar; it
 * does not change the JSON response.
 * @param tid Contest identifier used to resolve the problem in a contest context.
 */
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
