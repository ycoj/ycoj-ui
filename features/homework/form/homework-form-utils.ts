import type { CreateHomeworkRequest } from '@/api/client/method/homework/create';
import type { ProblemAutoCompleteItem } from '@/api/client/method/problem/auto-complete';
import type { HomeworkEditData } from '@/api/server/method/homework/edit';
import { serializeProblemIds } from '@/features/problem/problem-list-editor-utils';
import dayjs, { type Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { load as loadYaml } from 'js-yaml';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIME_ZONE = 'Asia/Shanghai';

export const DEFAULT_PENALTY_RULES = `# Format:
# hours: coefficient
1: 0.9
3: 0.8
12: 0.75
9999: 0.5`;

export type HomeworkFormValues = {
  title: string;
  beginAtDate: string;
  beginAtTime: string;
  penaltySinceDate: string;
  penaltySinceTime: string;
  extensionDays: string;
  assign: string[];
  maintainer: string[];
  penaltyRules: string;
  pids: ProblemAutoCompleteItem[];
  content: string;
  langs: string[];
};

export function getHomeworkCreateDefaults(
  timeZone?: string,
  now: Dayjs = dayjs()
): HomeworkFormValues {
  const beginAt = now
    .add(1, 'day')
    .tz(timeZone || DEFAULT_TIME_ZONE)
    .startOf('day');
  const penaltySince = beginAt.add(7, 'day').hour(23).minute(59);

  return {
    title: '',
    beginAtDate: beginAt.format('YYYY-MM-DD'),
    beginAtTime: beginAt.format('HH:mm'),
    penaltySinceDate: penaltySince.format('YYYY-MM-DD'),
    penaltySinceTime: penaltySince.format('HH:mm'),
    extensionDays: '1',
    assign: [],
    maintainer: [],
    penaltyRules: DEFAULT_PENALTY_RULES,
    pids: [],
    content: '',
    langs: [],
  };
}

export function isPenaltyRuleMapping(value: string) {
  try {
    return isNumberRecord(loadYaml(value));
  } catch {
    return false;
  }
}

export function buildCreateHomeworkPayload(
  values: HomeworkFormValues
): CreateHomeworkRequest {
  return {
    operation: 'update',
    beginAtDate: values.beginAtDate,
    beginAtTime: values.beginAtTime,
    penaltySinceDate: values.penaltySinceDate,
    penaltySinceTime: values.penaltySinceTime,
    extensionDays: Number(values.extensionDays),
    penaltyRules: values.penaltyRules.trim(),
    title: values.title.trim(),
    content: values.content.trim(),
    pids: serializeProblemIds(values.pids),
    rated: false,
    maintainer: values.maintainer.map(Number),
    assign: values.assign,
    langs: values.langs,
  };
}

export function padDate(value: string): string {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function padTime(value: string): string {
  const [hour, minute] = value.split(':');
  if (!hour || !minute) return value;
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

type HomeworkEditSource = Pick<
  HomeworkEditData,
  | 'tdoc'
  | 'dateBeginText'
  | 'timeBeginText'
  | 'datePenaltyText'
  | 'timePenaltyText'
  | 'extensionDays'
  | 'penaltyRules'
>;

export function mapHomeworkEditToFormValues(
  data: HomeworkEditSource,
  pids: ProblemAutoCompleteItem[]
): HomeworkFormValues {
  const tdoc = data.tdoc;

  return {
    title: tdoc.title,
    beginAtDate: padDate(data.dateBeginText),
    beginAtTime: padTime(data.timeBeginText),
    penaltySinceDate: padDate(data.datePenaltyText),
    penaltySinceTime: padTime(data.timePenaltyText),
    extensionDays: String(data.extensionDays),
    assign: tdoc.assign ?? [],
    maintainer: (tdoc.maintainer ?? []).map(String),
    penaltyRules: data.penaltyRules?.trim()
      ? data.penaltyRules
      : DEFAULT_PENALTY_RULES,
    pids,
    content: tdoc.content ?? '',
    langs: tdoc.langs ?? [],
  };
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((coefficient) => typeof coefficient === 'number')
  );
}
