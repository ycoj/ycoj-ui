import { formatGraceUntil } from './format-grace-until';
import { describe, expect, it } from 'vitest';

const ISO_DATE = '2026-08-08T00:00:00.000Z';

function expectedFormat(iso: string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

describe('formatGraceUntil', () => {
  it('formats a valid date string', () => {
    expect(formatGraceUntil('en', ISO_DATE)).toBe(expectedFormat(ISO_DATE));
  });

  it('returns null for null input', () => {
    expect(formatGraceUntil('en', null)).toBeNull();
  });

  it('returns null for an invalid date string', () => {
    expect(formatGraceUntil('en', 'not-a-date')).toBeNull();
  });
});
