import type { UserAutoCompleteItem } from '@/api/client/method/user/auto-complete';
import type {
  ListProjectionProblem,
  ProblemStatus,
  ProblemStatusDict,
} from '@/shared/types/problem';

export type OmnibarHotkeyEvent = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  repeat?: boolean;
};

export type OmnibarProblemHit = {
  kind: 'problem';
  id: string;
  href: string;
  problem: ListProjectionProblem;
};

export type OmnibarUserHit = {
  kind: 'user';
  id: string;
  href: string;
  user: UserAutoCompleteItem;
};

export type OmnibarHit = OmnibarProblemHit | OmnibarUserHit;

export function isOmnibarHotkey(event: OmnibarHotkeyEvent): boolean {
  if (event.repeat) return false;
  if (event.altKey || event.shiftKey) return false;
  if (event.key.toLowerCase() !== 'k') return false;
  return event.metaKey || event.ctrlKey;
}

export function isApplePlatform(platform = getNavigatorPlatform()): boolean {
  return /Mac|iPhone|iPad|iPod/.test(platform);
}

export function problemHref(problem: { pid?: string; docId: number }): string {
  return `/problem/${problem.pid || problem.docId}`;
}

export function userHref(user: { _id: number }): string {
  return `/user/${user._id}`;
}

export function buildOmnibarHits(
  pdocs: ListProjectionProblem[],
  udocs: UserAutoCompleteItem[]
): OmnibarHit[] {
  return [
    ...pdocs.map((problem) => ({
      kind: 'problem' as const,
      id: `problem-${problem.domainId}-${problem.docId}`,
      href: problemHref(problem),
      problem,
    })),
    ...udocs.map((user) => ({
      kind: 'user' as const,
      id: `user-${user._id}`,
      href: userHref(user),
      user,
    })),
  ];
}

export function lookupProblemStatus(
  psdict: ProblemStatusDict,
  docId: number
): ProblemStatus | undefined {
  return psdict[String(docId)];
}

export function nextHighlightIndex(
  current: number,
  length: number,
  direction: 1 | -1
): number {
  if (length <= 0) return -1;
  if (current < 0) return direction === 1 ? 0 : length - 1;
  return (current + direction + length) % length;
}

function getNavigatorPlatform(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.platform;
}
