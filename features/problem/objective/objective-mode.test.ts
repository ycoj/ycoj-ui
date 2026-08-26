import { isObjectiveReadOnly } from '@/features/problem/objective/objective-mode';
import { describe, expect, it } from 'vitest';

describe('isObjectiveReadOnly', () => {
  it('is writable in normal mode', () => {
    expect(isObjectiveReadOnly('normal')).toBe(false);
  });

  it('is writable in contest mode', () => {
    expect(isObjectiveReadOnly('contest')).toBe(false);
  });

  it('is read-only in view mode', () => {
    expect(isObjectiveReadOnly('view')).toBe(true);
  });

  it('is read-only in correction mode', () => {
    expect(isObjectiveReadOnly('correction')).toBe(true);
  });

  it('is read-only in none mode', () => {
    expect(isObjectiveReadOnly('none')).toBe(true);
  });

  it('falls back to read-only when mode is missing', () => {
    expect(isObjectiveReadOnly(undefined)).toBe(true);
  });
});
