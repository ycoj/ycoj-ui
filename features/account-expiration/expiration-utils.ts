import type { AccountExpirationUser } from '@/shared/types/account-expiration';

export function expirationStatus(user: AccountExpirationUser) {
  if (user.accountExpirationProtected) return 'protected';
  if (user.accountAutoExpired) return 'autoExpired';
  if (user.priv === 0) return 'banned';
  if (user.accountExpired) return 'expired';
  return 'active';
}

export function isExpirationDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function parseExpirationPage(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function updateExpirationSelection(
  users: AccountExpirationUser[],
  selected: number[],
  index: number,
  anchor: number | null,
  range: boolean
) {
  const user = users[index];
  if (!user || user.accountExpirationProtected) return selected;
  const checked = !selected.includes(user._id);
  const start = range && anchor !== null ? Math.min(anchor, index) : index;
  const end = range && anchor !== null ? Math.max(anchor, index) : index;
  const next = new Set(selected);
  for (const target of users.slice(start, end + 1)) {
    if (target.accountExpirationProtected) continue;
    if (checked) next.add(target._id);
    else next.delete(target._id);
  }
  return [...next];
}
