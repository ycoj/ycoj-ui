import { hasPerm, PERM } from '@/features/user/lib/priv';
import type { User } from '@/shared/types/user';

type TrainingForEditCheck = {
  owner: number;
};

export function canEditTraining(
  user: User,
  tdoc: TrainingForEditCheck
): boolean {
  if (!user._id) return false;
  if (user._id === tdoc.owner)
    return hasPerm(user, PERM.PERM_EDIT_TRAINING_SELF);
  return hasPerm(user, PERM.PERM_EDIT_TRAINING);
}
