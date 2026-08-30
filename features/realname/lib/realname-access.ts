import { PRIV } from '@/features/user/lib/priv';
import type { RealnameUserStatus } from '@/shared/types/realname';
import type { User } from '@/shared/types/user';

export const REALNAME_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export type RealnameAccess = {
  status: RealnameUserStatus;
  exempt: boolean;
  inGrace: boolean;
  graceUntil: Date | null;
  allowed: boolean;
  redirectTo: '/home/realname' | '/home/realname/result' | null;
};

export function getRealnameStatus(user: Pick<User, 'realnameStatus'>) {
  const status = user.realnameStatus;
  return status === 'pending' || status === 'approved' || status === 'rejected'
    ? status
    : 'none';
}

function parseSubmittedAt(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getRealnameAccess(
  user: Pick<User, 'priv' | 'realnameStatus' | 'realnameSubmittedAt'>,
  now = new Date()
): RealnameAccess {
  const status = getRealnameStatus(user);
  const exempt =
    user.priv === PRIV.PRIV_ALL ||
    (user.priv & PRIV.PRIV_JUDGE) === PRIV.PRIV_JUDGE;
  const submittedAt = parseSubmittedAt(user.realnameSubmittedAt);
  const graceUntil = submittedAt
    ? new Date(submittedAt.getTime() + REALNAME_GRACE_MS)
    : null;
  const inGrace =
    (status === 'pending' || status === 'rejected') &&
    !!graceUntil &&
    now.getTime() < graceUntil.getTime();
  const allowed = exempt || status === 'approved' || inGrace;

  return {
    status,
    exempt,
    inGrace,
    graceUntil,
    allowed,
    redirectTo: allowed
      ? null
      : status === 'none'
        ? '/home/realname'
        : '/home/realname/result',
  };
}
