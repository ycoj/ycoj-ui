import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { User } from '@/shared/types/user';

type HomeworkForEditCheck = {
  owner: number;
  maintainer?: number[];
};

export function canEditHomework(
  user: User,
  tdoc: HomeworkForEditCheck
): boolean {
  if (!user._id) return false;
  const owns =
    user._id === tdoc.owner || (tdoc.maintainer?.includes(user._id) ?? false);
  if (owns) return hasPerm(user, PERM.PERM_EDIT_HOMEWORK_SELF);
  return hasPerm(user, PERM.PERM_EDIT_HOMEWORK);
}
