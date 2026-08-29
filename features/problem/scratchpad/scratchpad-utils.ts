import type {
  ScratchpadLanguageOption,
  ScratchpadLanguages,
  ScratchpadRecord,
  ScratchpadTestcase,
} from '@/features/problem/scratchpad/scratchpad-types';
import { PRETEST_CONTEST_ID } from '@/features/problem/scratchpad/scratchpad-types';
import { formatTestcaseMessage } from '@/features/record/detail/format-testcase-message';
import { STATUS } from '@/shared/configs/status';
import type { JudgeMessageResponse } from '@/shared/types/record';

const DEFAULT_SCRATCHPAD_LANGUAGE = 'cc.cc14o2';

export function flattenScratchpadLanguages(
  languages: ScratchpadLanguages
): ScratchpadLanguageOption[] {
  return Object.entries(languages).flatMap(([familyKey, family]) =>
    family.versions.map((version) => ({
      familyKey,
      familyDisplay: family.display,
      name: version.name,
      display: version.display,
      pretest: version.pretest,
      validAs: version.validAs,
      hidden: version.hidden,
    }))
  );
}

export function canRunScratchpadPretest(
  problemType: string,
  language?: ScratchpadLanguageOption
): boolean {
  if (problemType === 'default') return true;
  if (problemType !== 'remote_judge' || !language) return false;
  if (language.pretest === false) return false;
  return Boolean(language.pretest || (language.validAs && !language.hidden));
}

export function resolveScratchpadLanguage(
  languages: ScratchpadLanguages,
  storedLanguage?: string,
  preferredLanguage?: string
): string {
  const options = flattenScratchpadLanguages(languages);
  const exact = (language?: string) =>
    language && options.some((option) => option.name === language)
      ? language
      : undefined;

  const stored = exact(storedLanguage);
  if (stored) return stored;

  const defaultLanguage = exact(DEFAULT_SCRATCHPAD_LANGUAGE);
  if (defaultLanguage) return defaultLanguage;

  const preferred = exact(preferredLanguage);
  if (preferred) return preferred;

  if (preferredLanguage) {
    const family = preferredLanguage.split('.')[0];
    const familyMatch = options.find((option) => option.familyKey === family);
    if (familyMatch) return familyMatch.name;
  }

  return options[0]?.name ?? '';
}

export function getScratchpadFamilyKey(
  languages: ScratchpadLanguages,
  language: string
): string {
  return (
    flattenScratchpadLanguages(languages).find(
      (option) => option.name === language
    )?.familyKey ?? ''
  );
}

export function getScratchpadDraftId({
  userId,
  domainId,
  problemDocId,
  eventKind,
  tid,
}: {
  userId: number;
  domainId: string;
  problemDocId: number;
  eventKind: 'standalone' | 'contest' | 'homework';
  tid?: string;
}): string {
  return JSON.stringify([
    userId,
    domainId,
    problemDocId,
    eventKind,
    tid ?? null,
  ]);
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function parseCompilerTexts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function parseTestcaseMessage(
  value: unknown
): string | JudgeMessageResponse | undefined {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return undefined;
  const message = (value as { message?: unknown }).message;
  if (typeof message !== 'string') return undefined;
  const params = (value as { params?: unknown }).params;
  if (!Array.isArray(params)) return { message };
  return {
    message,
    params: params.filter(
      (item): item is string | number =>
        typeof item === 'string' || typeof item === 'number'
    ),
  };
}

function parseTestCases(value: unknown): ScratchpadTestcase[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const message = parseTestcaseMessage(
      (item as { message?: unknown }).message
    );
    return message === undefined ? [] : [{ message }];
  });
}

export function toScratchpadRecord(value: unknown): ScratchpadRecord | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const _id = asNonEmptyString(record._id);
  const domainId = asNonEmptyString(record.domainId);
  const pid = asFiniteNumber(record.pid);
  const uid = asFiniteNumber(record.uid);
  const lang = asNonEmptyString(record.lang);
  const score = asFiniteNumber(record.score);
  const memory = asFiniteNumber(record.memory);
  const time = asFiniteNumber(record.time);
  const status = asFiniteNumber(record.status);
  if (
    !_id ||
    !domainId ||
    pid === undefined ||
    uid === undefined ||
    !lang ||
    score === undefined ||
    memory === undefined ||
    time === undefined ||
    status === undefined
  ) {
    return null;
  }

  const progress = asFiniteNumber(record.progress);
  const contest = asNonEmptyString(record.contest);
  return {
    _id,
    domainId,
    pid,
    uid,
    lang,
    score,
    memory,
    time,
    status,
    compilerTexts: parseCompilerTexts(record.compilerTexts),
    testCases: parseTestCases(record.testCases),
    ...(progress !== undefined ? { progress } : {}),
    ...(contest ? { contest } : {}),
  };
}

export function parseScratchpadRecords(value: unknown): ScratchpadRecord[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const record = toScratchpadRecord(item);
    return record ? [record] : [];
  });
}

export function parseScratchpadRecordMessage(
  message: unknown
): ScratchpadRecord | null {
  if (!message || typeof message !== 'object') return null;
  return toScratchpadRecord((message as { rdoc?: unknown }).rdoc);
}

export function createOptimisticScratchpadRecord({
  id,
  domainId,
  pid,
  uid,
  lang,
  contest,
}: {
  id: string;
  domainId: string;
  pid: number;
  uid: number;
  lang: string;
  contest?: string;
}): ScratchpadRecord {
  return {
    _id: id,
    domainId,
    pid,
    uid,
    lang,
    score: 0,
    memory: 0,
    time: 0,
    status: STATUS.STATUS_WAITING,
    compilerTexts: [],
    testCases: [],
    ...(contest ? { contest } : {}),
  };
}

export function isPretestRecord(record: ScratchpadRecord): boolean {
  return record.contest === PRETEST_CONTEST_ID;
}

export function mergeScratchpadRecords(
  current: ScratchpadRecord[],
  incoming: ScratchpadRecord[]
): ScratchpadRecord[] {
  const records = new Map(current.map((record) => [record._id, record]));
  const order = current.map((record) => record._id);

  for (const record of incoming) {
    if (isPretestRecord(record)) continue;
    const existing = records.get(record._id);
    records.set(record._id, existing ? { ...existing, ...record } : record);
    if (!order.includes(record._id)) order.unshift(record._id);
  }

  return order.map((id) => records.get(id)!).slice(0, 10);
}

export function formatScratchpadPretestOutput(
  record: ScratchpadRecord,
  statusText: string
): string {
  const summary = [statusText, `${record.time}ms`, `${record.memory}KiB`];
  const output = [summary.join(' ')];
  if (record.compilerTexts.length) {
    output.push(record.compilerTexts.join('\n'));
  }
  const testcase = record.testCases[0];
  if (testcase?.message) {
    output.push(formatTestcaseMessage(testcase.message));
  }
  return output.filter(Boolean).join('\n');
}
