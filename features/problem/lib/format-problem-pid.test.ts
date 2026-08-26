import { formatProblemPid } from '@/features/problem/lib/format-problem-pid';
import { describe, expect, it } from 'vitest';

describe('formatProblemPid', () => {
  it('returns pid when present', () => {
    expect(formatProblemPid({ pid: 'P1000', docId: 1000 })).toBe('P1000');
  });

  it('falls back to P+docId when pid is undefined', () => {
    expect(formatProblemPid({ pid: undefined, docId: 1001 })).toBe('P1001');
  });

  it('falls back to P+docId when pid is empty string', () => {
    expect(formatProblemPid({ pid: '', docId: 1002 })).toBe('P1002');
  });
});
