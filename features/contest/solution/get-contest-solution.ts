import ServerApis from '@/api/server/method';
import type {
  ContestSolutionCreateResponse,
  ContestSolutionEditResponse,
  ContestSolutionResponse,
} from '@/api/server/method/contests/solution';
import type { HydroError } from '@/shared/types/error';
import { cache } from 'react';
import 'server-only';

export const getContestSolution = cache(
  async (tid: string, sid: string): Promise<ContestSolutionResponse> => {
    return await ServerApis.Contests.getContestSolution(tid, sid);
  }
);
export const getContestSolutionCreate = cache(
  async (tid: string): Promise<ContestSolutionCreateResponse> => {
    return await ServerApis.Contests.getContestSolutionCreate(tid);
  }
);
export const getContestSolutionEdit = cache(
  async (tid: string, sid: string): Promise<ContestSolutionEditResponse> => {
    return await ServerApis.Contests.getContestSolutionEdit(tid, sid);
  }
);

/**
 * Narrow a create/edit response to manageable data or a renderable error.
 * `canManage` is optional fail-safe: absence means no management controls.
 * Callers render `<Errored>` when `error` is present.
 */
export function requireContestSolutionManage<T extends { canManage?: boolean }>(
  data: T | { error: HydroError },
  fallbackError: string
): { data: T } | { error: HydroError | string } {
  if ('error' in data) return { error: data.error };
  if (!data.canManage) return { error: fallbackError };
  return { data };
}
