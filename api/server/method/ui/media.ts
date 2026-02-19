import { alova } from '@/api/server';
import type { Contest } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import type { ProblemDoc } from '@/shared/types/problem';
import { ObjectId } from '@/shared/types/shared';
import type { BaseUser } from '@/shared/types/user';

export type MediaRequestParams = {
  /** User IDs; requires PERM_VIEW if provided */
  uids?: number[];
  /** Problem IDs; requires PERM_VIEW and PERM_VIEW_PROBLEM if provided */
  pids?: number[];
  /** Contest IDs (ObjectId); requires PERM_VIEW and PERM_VIEW_CONTEST if provided */
  cids?: ObjectId[];
  /** Homework IDs (ObjectId); requires PERM_VIEW and PERM_VIEW_HOMEWORK if provided */
  hids?: ObjectId[];
};

export type MediaResponse = {
  udict: Record<number, BaseUser>;
  pdict: Record<number, ProblemDoc>;
  cdict: Record<string, Contest>;
  hdict: Record<string, Homework>;
};

/**
 * Rich Media Data: fetches user, problem, contest, and homework docs for display.
 * All params are optional but at least one must be provided. Returns only resources the current user can access.
 */
const MEDIA_CACHE_MS = 30 * 60 * 1000; // 30 minutes

export const getMedia = (params: MediaRequestParams) =>
  alova.Post<MediaResponse>('/ui/media', params as Record<string, unknown>, {
    cacheFor: MEDIA_CACHE_MS,
  });
