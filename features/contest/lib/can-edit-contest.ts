import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { User } from '@/shared/types/user';

type ContestForEditCheck = {
  owner: number;
  maintainer?: number[];
};

export function canEditContest(user: User, tdoc: ContestForEditCheck): boolean {
  if (!user._id) return false;
  const owns =
    user._id === tdoc.owner || (tdoc.maintainer?.includes(user._id) ?? false);
  if (owns) return hasPerm(user, PERM.PERM_EDIT_CONTEST_SELF);
  return hasPerm(user, PERM.PERM_EDIT_CONTEST);
}
