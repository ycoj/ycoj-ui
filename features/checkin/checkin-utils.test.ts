import {
  buildCheckinCalendar,
  formatHitokotoSource,
  listCheckinDates,
  parseCheckinDate,
} from './checkin-utils';
import type { CheckinRecord } from '@/shared/types/checkin';
import { describe, expect, it } from 'vitest';

function makeRecord(
  date: string,
  fromWho: string | null = 'Author',
  from = 'Source'
): CheckinRecord {
  return {
    date,
    fortune: 'da_ji',
    createdAt: `${date}T04:00:00.000Z`,
    hitokoto: {
      id: 1,
      uuid: 'quote-1',
      text: 'A quote',
      type: 'a',
      from,
      fromWho,
    },
  };
}

describe('check-in date helpers', () => {
  it('validates API calendar dates without using the browser timezone', () => {
    expect(parseCheckinDate('2024-02-29')?.toISOString()).toBe(
      '2024-02-29T00:00:00.000Z'
    );
    expect(parseCheckinDate('2023-02-29')).toBeNull();
    expect(parseCheckinDate('2024-2-9')).toBeNull();
  });

  it('generates exactly 365 inclusive UTC calendar dates', () => {
    const dates = listCheckinDates('2025-08-02', '2026-08-01');
    expect(dates).toHaveLength(365);
    expect(dates[0]).toBe('2025-08-02');
    expect(dates.at(-1)).toBe('2026-08-01');
  });

  it('pads complete weeks and matches records directly by date', () => {
    const record = makeRecord('2026-08-01');
    const weeks = buildCheckinCalendar('2026-07-30', '2026-08-01', [record]);
    const cells = weeks.flat();

    expect(cells).toHaveLength(7);
    expect(cells.slice(0, 4).every((cell) => cell.kind === 'placeholder')).toBe(
      true
    );
    expect(cells[6]).toEqual({
      kind: 'date',
      date: '2026-08-01',
      record,
    });
  });
});

describe('formatHitokotoSource', () => {
  it('formats author and source', () => {
    expect(formatHitokotoSource(makeRecord('2026-08-01'))).toBe(
      '—— Author《Source》'
    );
  });

  it('formats a source when fromWho is null', () => {
    expect(formatHitokotoSource(makeRecord('2026-08-01', null))).toBe(
      '——《Source》'
    );
  });

  it('omits an empty attribution', () => {
    expect(formatHitokotoSource(makeRecord('2026-08-01', null, ''))).toBeNull();
  });
});
