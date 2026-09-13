import { PRIV } from '@/features/user/lib/priv';
import type { User } from '@/shared/types/user';

export function canEditSystem(user: Pick<User, 'priv'>) {
  return (user.priv & PRIV.PRIV_EDIT_SYSTEM) === PRIV.PRIV_EDIT_SYSTEM;
}

// Both areas currently require the same privilege; keep the names separate so
// a future privilege change only touches the relevant alias.
export const canManageExpiration = canEditSystem;
export const canImportUsers = canEditSystem;

export function manageLanding(user: Pick<User, 'priv'>) {
  if (user.priv === PRIV.PRIV_ALL) return '/manage/realname';
  if (canImportUsers(user)) return '/manage/user-import';
  return canManageExpiration(user) ? '/manage/user-expiration' : '/home';
}
