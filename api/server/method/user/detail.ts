import { alova } from '@/api/server';
import type { Contest } from '@/shared/types/contest';
import type { Homework } from '@/shared/types/homework';
import type {
  ProblemDict,
  ProblemDoc,
  SolutionDoc,
} from '@/shared/types/problem';
import type { User } from '@/shared/types/user';

/** User document as returned by the user detail API. */
export type Udoc = Pick<
  User,
  '_id' | 'mail' | 'uname' | 'priv' | 'regat' | 'loginat'
>;

/** Recent session info (login/refresh time). */
export type UserDetailSessionDoc = {
  createAt: string;
  updateAt: string;
};

/** Problem solution list item (user's published solutions). Requires PERM_VIEW_PROBLEM_SOLUTION. */
export type SolutionDocumentDoc = Pick<
  SolutionDoc,
  'docId' | '_id' | 'owner' | 'vote' | 'parentId' | 'parentType'
>;

export type UserDetailResponse = {
  /** Whether this is the current logged-in user's own profile. */
  isSelfProfile: boolean;
  udoc: Udoc;
  /** Latest session info, or null. */
  sdoc: UserDetailSessionDoc | null;
  /** Problems the user has passed. Requires PERM_VIEW_PROBLEM. */
  pdocs: ProblemDoc[];
  /** Tag stats for passed problems (top 20). [tag, count][] */
  tags: [string, number][];
  /** Contests/homework the user has participated in. */
  tdocs: (Contest | Homework)[];
  /** User's published problem solutions. Requires PERM_VIEW_PROBLEM_SOLUTION. */
  psdocs?: SolutionDocumentDoc[];
  /** Problem dict for solutions. Requires PERM_VIEW_PROBLEM_SOLUTION and PERM_VIEW_PROBLEM. */
  pdict?: ProblemDict;
};

/**
 * Fetches user detail by uid.
 * GET /user/:uid — uid must not be 0 (returns UserNotFoundError).
 */
export const getUserDetail = (uid: number) =>
  alova.Get<UserDetailResponse>(`/user/${uid}`);
