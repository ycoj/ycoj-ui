import { formatRecordTime } from './format-time';
import { describe, expect, it } from 'vitest';

describe('formatRecordTime', () => {
  it('formats an ISO timestamp in the site time zone', () => {
    expect(formatRecordTime('2026-09-16T15:38:57.000Z')).toBe('09-16 23:38:57');
  });

  it('formats an ObjectId-derived timestamp', () => {
    expect(formatRecordTime(Date.UTC(2026, 8, 16, 15, 38, 57))).toBe(
      '09-16 23:38:57'
    );
  });

  it('returns a placeholder for missing or invalid values', () => {
    expect(formatRecordTime(undefined)).toBe('-');
    expect(formatRecordTime('')).toBe('-');
    expect(formatRecordTime(Number.NaN)).toBe('-');
    expect(formatRecordTime('not-a-date')).toBe('-');
  });
});
