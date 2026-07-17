import { formatMemory, formatTime } from './format-units';
import { describe, expect, it } from 'vitest';

describe('formatTime', () => {
  it('returns "-" for non-finite values', () => {
    expect(formatTime(Number.NaN)).toBe('-');
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('-');
  });

  it('formats with fixed units', () => {
    expect(formatTime(1500, 'ms')).toBe('1500ms');
    expect(formatTime(1500, 's')).toBe('1.5s');
    expect(formatTime(90_000, 'min')).toBe('1.5min');
  });

  it('auto-selects unit by magnitude', () => {
    expect(formatTime(999)).toBe('999ms');
    expect(formatTime(1000)).toBe('1s');
    expect(formatTime(59_999)).toBe('59s');
    expect(formatTime(60_000)).toBe('1min');
  });
});

describe('formatMemory', () => {
  it('returns "-" for non-finite values', () => {
    expect(formatMemory(Number.NaN)).toBe('-');
    expect(formatMemory(Number.NEGATIVE_INFINITY)).toBe('-');
  });

  it('formats with fixed units', () => {
    expect(formatMemory(512, 'B')).toBe('512.0B');
    expect(formatMemory(2048, 'KiB')).toBe('2.0KiB');
    expect(formatMemory(1024 ** 2, 'MiB')).toBe('1.0MiB');
    expect(formatMemory(1024 ** 3, 'GiB')).toBe('1.0GiB');
  });

  it('auto-selects unit by magnitude', () => {
    expect(formatMemory(512)).toBe('512B');
    expect(formatMemory(1024)).toBe('1KiB');
    expect(formatMemory(1024 ** 2)).toBe('1MiB');
    expect(formatMemory(1024 ** 3)).toBe('1GiB');
  });
});
