import type { CreateContestRequest } from '@/api/client/method/contest/create';
import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import { serializeProblemIds } from '@/features/problem/problem-list-editor-utils';
import dayjs, { type Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIME_ZONE = 'Asia/Shanghai';

export const CONTEST_CREATE_RULES = [
  'acm',
  'oi',
  'ioi',
  'ledo',
  'strictioi',
] as const;

export const CONTEST_PERMISSIONS = ['public', 'invite', 'assign'] as const;

export type ContestCreateRule = (typeof CONTEST_CREATE_RULES)[number];
export type ContestPermission = (typeof CONTEST_PERMISSIONS)[number];
export type ContestFormValues = {
  rule: ContestCreateRule;
  title: string;
  beginAtDate: string;
  beginAtTime: string;
  duration: string;
  pids: ProblemAutoCompleteItem[];
  content: string;
  maintainer: string[];
  permission: ContestPermission;
  assign: string[];
  code: string;
  langs: string[];
  rated: boolean;
  autoHide: boolean;
  allowViewCode: boolean;
  allowPrint: boolean;
  keepScoreboardHidden: boolean;
  lock: string;
  contestDuration: string;
};

export const contestRuleSupportsLock = (rule: ContestCreateRule) =>
  rule === 'acm' || rule === 'ioi';

export const contestRuleSupportsFlexibleDuration = (rule: ContestCreateRule) =>
  rule === 'oi' || rule === 'ioi' || rule === 'ledo' || rule === 'strictioi';

export const contestRuleSupportsHiddenScoreboard = (rule: ContestCreateRule) =>
  rule === 'oi' || rule === 'strictioi';

export function getContestCreateDefaults(
  timeZone?: string,
  now: Dayjs = dayjs()
): ContestFormValues {
  const nextQuarterTimestamp =
    Math.floor(now.valueOf() / (15 * 60 * 1000)) * (15 * 60 * 1000) +
    15 * 60 * 1000;
  const beginAt = dayjs(nextQuarterTimestamp).tz(timeZone || DEFAULT_TIME_ZONE);

  return {
    rule: 'acm',
    title: '',
    beginAtDate: beginAt.format('YYYY-MM-DD'),
    beginAtTime: beginAt.format('HH:mm'),
    duration: '2',
    pids: [],
    content: '',
    maintainer: [],
    permission: 'public',
    assign: [],
    code: '',
    langs: [],
    rated: true,
    autoHide: false,
    allowViewCode: true,
    allowPrint: false,
    keepScoreboardHidden: false,
    lock: '',
    contestDuration: '',
  };
}

export function buildCreateContestPayload(
  values: ContestFormValues
): CreateContestRequest {
  return {
    operation: 'update',
    beginAtDate: values.beginAtDate,
    beginAtTime: values.beginAtTime,
    duration: Number(values.duration),
    title: values.title.trim(),
    content: values.content.trim(),
    rule: values.rule,
    pids: serializeProblemIds(values.pids),
    rated: values.rated,
    code: values.permission === 'invite' ? values.code.trim() : '',
    autoHide: values.autoHide,
    assign: values.permission === 'assign' ? values.assign : [],
    lock:
      contestRuleSupportsLock(values.rule) && values.lock.trim()
        ? Number(values.lock)
        : undefined,
    contestDuration:
      contestRuleSupportsFlexibleDuration(values.rule) &&
      values.contestDuration.trim()
        ? Number(values.contestDuration)
        : undefined,
    maintainer: values.maintainer.map(Number),
    allowViewCode: values.allowViewCode,
    allowPrint: values.allowPrint,
    keepScoreboardHidden:
      contestRuleSupportsHiddenScoreboard(values.rule) &&
      values.keepScoreboardHidden,
    langs: values.langs,
  };
}

export function formatHours(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

export function contestPermissionFromTdoc(tdoc: {
  assign?: string[];
  _code?: string;
}): ContestPermission {
  if (tdoc.assign?.length) return 'assign';
  if (tdoc._code) return 'invite';
  return 'public';
}

export function isContestCreateRule(rule: string): rule is ContestCreateRule {
  return (CONTEST_CREATE_RULES as readonly string[]).includes(rule);
}

type ContestEditSource = {
  tdoc: {
    title: string;
    content?: string;
    rule: string;
    beginAt: Date;
    endAt: Date;
    maintainer?: number[];
    assign?: string[];
    _code?: string;
    langs?: string[];
    rated?: boolean;
    autoHide?: boolean;
    allowViewCode?: boolean;
    allowPrint?: boolean;
    keepScoreboardHidden?: boolean;
    lockAt?: Date;
    duration?: number;
  };
  duration: number;
};

export function mapContestEditToFormValues(
  data: ContestEditSource,
  pids: ProblemAutoCompleteItem[],
  timeZone?: string
): ContestFormValues {
  const tdoc = data.tdoc;
  const rule = isContestCreateRule(tdoc.rule) ? tdoc.rule : 'acm';
  const beginAt = dayjs(tdoc.beginAt).tz(timeZone || DEFAULT_TIME_ZONE);
  const lockAt = tdoc.lockAt ? dayjs(tdoc.lockAt) : null;
  const endAt = dayjs(tdoc.endAt);
  const lockMinutes =
    lockAt?.isValid() && endAt.isValid()
      ? endAt.diff(lockAt, 'minute', true)
      : 0;

  return {
    rule,
    title: tdoc.title,
    beginAtDate: beginAt.format('YYYY-MM-DD'),
    beginAtTime: beginAt.format('HH:mm'),
    duration: formatHours(data.duration),
    pids,
    content: tdoc.content ?? '',
    maintainer: (tdoc.maintainer ?? []).map(String),
    permission: contestPermissionFromTdoc(tdoc),
    assign: tdoc.assign ?? [],
    code: tdoc._code ?? '',
    langs: tdoc.langs ?? [],
    rated: Boolean(tdoc.rated),
    autoHide: Boolean(tdoc.autoHide),
    allowViewCode: Boolean(tdoc.allowViewCode),
    allowPrint: Boolean(tdoc.allowPrint),
    keepScoreboardHidden: Boolean(tdoc.keepScoreboardHidden),
    lock: lockMinutes > 0 ? String(Math.round(lockMinutes)) : '',
    contestDuration:
      typeof tdoc.duration === 'number' && tdoc.duration > 0
        ? formatHours(tdoc.duration)
        : '',
  };
}
