import type { ContestSolutionListItem } from '@/api/server/method/contests/solution';
import oid2ts from '@/shared/lib/oid2ts';
import type { ContestRule } from '@/shared/types/contest';

export function canShowContestSolutions(
  rule: ContestRule,
  showContestSolutions?: boolean
): boolean {
  if (rule === 'homework') return false;
  return showContestSolutions === true;
}

/**
 * Resolve the rows visible in the solutions section.
 * Returns null when the section should stay hidden from readers
 * (no solutions and no management permission).
 */
export function getVisibleContestSolutions(
  csdocs: ContestSolutionListItem[] | undefined,
  canManage?: boolean
): ContestSolutionListItem[] | null {
  const items = csdocs ?? [];
  if (items.length === 0 && !canManage) return null;
  return items;
}

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

/**
 * Derive the creation time from a solution ObjectId.
 * The list API only returns docId/title/owner, so the timestamp prefix of the
 * ObjectId is the only available time source. Returns null for malformed ids
 * so callers can render a fallback instead of an invalid date.
 */
export function getContestSolutionDate(docId: string): Date | null {
  if (!OBJECT_ID_PATTERN.test(docId)) return null;
  return new Date(oid2ts(docId));
}
