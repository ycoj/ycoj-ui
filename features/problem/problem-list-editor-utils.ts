import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';

const LIST_SEPARATOR = /[,，\s]+/;

export const serializeProblemIds = (items: ProblemAutoCompleteItem[]) =>
  items.map((item) => item.docId).join(',');

export const parseProblemIdList = (value: string) => {
  const ids: number[] = [];
  const seen = new Set<number>();

  for (const part of value.split(LIST_SEPARATOR)) {
    if (!/^\d+$/.test(part)) continue;
    const docId = Number(part);
    if (!Number.isSafeInteger(docId)) continue;
    if (seen.has(docId)) continue;
    seen.add(docId);
    ids.push(docId);
  }

  return ids;
};

export const appendUniqueProblems = (
  current: ProblemAutoCompleteItem[],
  incoming: ProblemAutoCompleteItem[]
) => {
  const seen = new Set(current.map((item) => item.docId));
  const next = [...current];

  for (const item of incoming) {
    if (seen.has(item.docId)) continue;
    seen.add(item.docId);
    next.push(item);
  }

  return next;
};

export const reorderItems = <T>(items: T[], from: number, to: number) => {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

export const problemListLabel = (problem: ProblemAutoCompleteItem) =>
  problem.pid
    ? `${problem.pid}. ${problem.title}`
    : `#${problem.docId}. ${problem.title}`;
