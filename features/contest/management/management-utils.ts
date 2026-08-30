import type { ContestBulkSubmitResult } from '@/api/client/method/contest/bulk-submit';

export const validateContestScore = (value: number) =>
  Number.isInteger(value) && value > 0;

export const canResumeContestUser = (
  status: { endAt?: Date },
  now = Date.now(),
  contestEndAt?: Date
) =>
  Boolean(
    status.endAt &&
    new Date(status.endAt).getTime() < now &&
    (!contestEndAt || new Date(contestEndAt).getTime() > now)
  );

export const canRemoveContestUser = (beginAt: Date, now = Date.now()) =>
  new Date(beginAt).getTime() > now;

export type ClarificationSubject =
  | { type: 'general' }
  | { type: 'technical' }
  | { type: 'problem'; title: string };

export const getClarificationSubject = (
  subject: number,
  problemName?: string
): ClarificationSubject =>
  subject === 0
    ? { type: 'general' }
    : subject === -1
      ? { type: 'technical' }
      : { type: 'problem', title: problemName || `#${subject}` };

export const getObjectIdDate = (value: string) => {
  const timestamp = value.slice(0, 8);
  if (!/^[0-9a-f]{8}$/i.test(timestamp)) return null;
  const date = new Date(Number.parseInt(timestamp, 16) * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const serializeBalloonConfig = (
  config: Record<number, { color: string; name: string }>
) =>
  Object.entries(config)
    .map(
      ([pid, item]) =>
        `${pid}:\n  color: ${JSON.stringify(item.color)}\n  name: ${JSON.stringify(item.name)}`
    )
    .join('\n');

export const normalizeZipMode = (mode: string): 'auto' | 'nested' | 'flat' =>
  mode === 'nested' || mode === 'flat' ? mode : 'auto';

export const normalizeBulkResult = (
  result: ContestBulkSubmitResult | Record<string, unknown>
) => ({
  users: Array.isArray(result.users) ? result.users : [],
  submitted: Array.isArray(result.submitted) ? result.submitted : [],
  skipped: Array.isArray(result.skipped) ? result.skipped : [],
  dryrun: Boolean(result.dryrun),
});

export type BulkSubmitTreeNode = {
  id: string;
  name: string;
  type: 'archive' | 'folder' | 'file' | 'ellipsis';
  children?: BulkSubmitTreeNode[];
};

export const buildBulkSubmitZipTree = (
  mode: 'auto' | 'nested' | 'flat',
  pids: number[],
  mapping: Record<number, string>
): BulkSubmitTreeNode => {
  const names = pids
    .map((pid) => mapping[pid]?.trim())
    .filter((name): name is string => Boolean(name));
  const shown = (names.length ? names : ['A']).slice(0, 2);
  const hasMore = names.length > shown.length;
  const problemNodes = (user: string, nested: boolean) => {
    const nodes: BulkSubmitTreeNode[] = shown.map((name, index) =>
      nested
        ? {
            id: `${user}-problem-${index}`,
            name,
            type: 'folder',
            children: [
              {
                id: `${user}-problem-${index}-file`,
                name: `${name}.cpp`,
                type: 'file',
              },
            ],
          }
        : {
            id: `${user}-problem-${index}-file`,
            name: `${name}.cpp`,
            type: 'file',
          }
    );
    if (hasMore) {
      nodes.push({
        id: `${user}-more`,
        name: '…',
        type: 'ellipsis',
      });
    }
    return nodes;
  };

  return {
    id: 'archive',
    name: '*.zip',
    type: 'archive',
    children: [
      {
        id: 'alice',
        name: 'alice',
        type: 'folder',
        children: problemNodes('alice', mode !== 'flat'),
      },
      {
        id: 'bob',
        name: 'bob',
        type: 'folder',
        children: problemNodes('bob', mode === 'nested'),
      },
    ],
  };
};
