import { PRIV } from '@/features/user/lib/priv';
import type { User } from '@/shared/types/user';

export function canManageExpiration(user: Pick<User, 'priv'>) {
  return (user.priv & PRIV.PRIV_EDIT_SYSTEM) === PRIV.PRIV_EDIT_SYSTEM;
}

export function manageLanding(user: Pick<User, 'priv'>) {
  if (user.priv === PRIV.PRIV_ALL) return '/manage/realname';
  return canManageExpiration(user) ? '/manage/user-expiration' : '/home';
}
