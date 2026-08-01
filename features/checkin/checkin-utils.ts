import type { CheckinRecord } from '@/shared/types/checkin';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_IN_MS = 86_400_000;

export type CheckinCalendarCell =
  | { kind: 'placeholder'; key: string }
  | { kind: 'date'; date: string; record?: CheckinRecord };

export function parseCheckinDate(date: string): Date | null {
  const match = DATE_PATTERN.exec(date);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const value = new Date(Date.UTC(year, month - 1, day));

  if (
    value.getUTCFullYear() !== year ||
    value.getUTCMonth() !== month - 1 ||
    value.getUTCDate() !== day
  ) {
    return null;
  }
  return value;
}

export function formatCheckinDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function listCheckinDates(from: string, to: string): string[] {
  const start = parseCheckinDate(from);
  const end = parseCheckinDate(to);
  if (!start || !end || start > end) return [];

  const dates: string[] = [];
  for (
    let timestamp = start.getTime();
    timestamp <= end.getTime();
    timestamp += DAY_IN_MS
  ) {
    dates.push(formatCheckinDate(new Date(timestamp)));
  }
  return dates;
}

export function buildCheckinCalendar(
  from: string,
  to: string,
  records: CheckinRecord[]
): CheckinCalendarCell[][] {
  const dates = listCheckinDates(from, to);
  if (!dates.length) return [];

  const recordByDate = new Map(records.map((record) => [record.date, record]));
  const firstDate = parseCheckinDate(dates[0]);
  const leading = firstDate?.getUTCDay() ?? 0;
  const cells: CheckinCalendarCell[] = [
    ...Array.from({ length: leading }, (_, index) => ({
      kind: 'placeholder' as const,
      key: `leading-${index}`,
    })),
    ...dates.map((date) => ({
      kind: 'date' as const,
      date,
      record: recordByDate.get(date),
    })),
  ];
  const trailing = (7 - (cells.length % 7)) % 7;
  cells.push(
    ...Array.from({ length: trailing }, (_, index) => ({
      kind: 'placeholder' as const,
      key: `trailing-${index}`,
    }))
  );

  return Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7)
  );
}

export function formatHitokotoSource(record: CheckinRecord): string | null {
  const author = record.hitokoto.fromWho?.trim();
  const source = record.hitokoto.from.trim();
  if (!author && !source) return null;
  if (!author) return `——《${source}》`;
  return `—— ${author}${source ? `《${source}》` : ''}`;
}
