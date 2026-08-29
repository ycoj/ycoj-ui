import type {
  ScratchpadLanguageOption,
  ScratchpadLanguages,
  ScratchpadRecord,
} from '@/features/problem/scratchpad/scratchpad-types';
import { PRETEST_CONTEST_ID } from '@/features/problem/scratchpad/scratchpad-types';
import { formatTestcaseMessage } from '@/features/record/detail/format-testcase-message';

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
  const summary = [statusText];
  if (typeof record.time === 'number') summary.push(`${record.time}ms`);
  if (typeof record.memory === 'number') summary.push(`${record.memory}KiB`);

  const output = [summary.join(' ')];
  if (record.compilerTexts?.length) {
    output.push(record.compilerTexts.join('\n'));
  }
  const testcase = record.testCases?.[0];
  if (testcase?.message) {
    output.push(formatTestcaseMessage(testcase.message));
  }
  return output.filter(Boolean).join('\n');
}

export function isScratchpadRecordMessage(
  message: unknown
): message is { rdoc: ScratchpadRecord } {
  if (!message || typeof message !== 'object') return false;
  const rdoc = (message as { rdoc?: unknown }).rdoc;
  return (
    !!rdoc &&
    typeof rdoc === 'object' &&
    typeof (rdoc as { _id?: unknown })._id === 'string'
  );
}
