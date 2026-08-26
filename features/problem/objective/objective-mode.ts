import type { ProblemDetailMode } from '@/api/server/method/problems/detail';

/**
 * Objective problems are writable only in `normal` and `contest` modes.
 * A missing mode is treated as read-only (fail-safe): the backend may omit
 * it, and submission must stay locked unless a writable mode is explicit.
 */
export function isObjectiveReadOnly(
  mode: ProblemDetailMode | undefined
): boolean {
  return mode !== 'normal' && mode !== 'contest';
}
