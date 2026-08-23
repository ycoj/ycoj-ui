import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { User } from '@/shared/types/user';

type ProblemForEditCheck = {
  owner: number;
  reference?: unknown;
};

type Options = {
  tid?: string;
};

/**
 * Single source of truth for "can edit problem" permission.
 * Covers: login check, reference-problem guard, contest-mode guard,
 * and (owner + PERM_EDIT_PROBLEM_SELF) || PERM_EDIT_PROBLEM.
 */
export function canEditProblem(
  user: User,
  pdoc: ProblemForEditCheck,
  options?: Options
): boolean {
  if (!user._id) return false;
  if (pdoc.reference) return false;
  if (options?.tid) return false;

  const isOwner = user._id === pdoc.owner;
  const hasSelfPerm = hasPerm(user, PERM.PERM_EDIT_PROBLEM_SELF);
  const hasEditPerm = hasPerm(user, PERM.PERM_EDIT_PROBLEM);

  return (isOwner && hasSelfPerm) || hasEditPerm;
}
