import type { ContestBulkSubmitResult } from '@/api/client/method/contest/bulk-submit';

export const validateContestScore = (value: number) =>
  Number.isFinite(value) && value > 0;

export const canResumeContestUser = (
  status: { endAt?: Date },
  now = Date.now()
) => Boolean(status.endAt && new Date(status.endAt).getTime() < now);

export const canRemoveContestUser = (beginAt: Date, now = Date.now()) =>
  new Date(beginAt).getTime() > now;

export const getClarificationSubject = (
  subject: number,
  problemName?: string
) =>
  subject === 0
    ? 'General'
    : subject === -1
      ? 'Technical'
      : problemName || `Problem ${subject}`;

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
