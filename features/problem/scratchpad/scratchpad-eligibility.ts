import type { ProblemDetailMode } from '@/api/server/method/problems/detail';
import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { User } from '@/shared/types/user';

export function canEnterScratchpad(
  user: User | null,
  mode: ProblemDetailMode | undefined,
  isObjective: boolean,
  contextActive = true
): boolean {
  return (
    !isObjective &&
    !!user?._id &&
    hasPerm(user, PERM.PERM_SUBMIT_PROBLEM) &&
    contextActive &&
    (mode === 'normal' || mode === 'contest')
  );
}
