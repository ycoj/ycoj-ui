import { getScoreColorClass } from './scoreboard-cell';
import { describe, expect, it } from 'vitest';

describe('getScoreColorClass', () => {
  it('uses green for scores >= 100', () => {
    expect(getScoreColorClass(100)).toContain('text-green-600');
    expect(getScoreColorClass(100)).toContain('font-semibold');
    expect(getScoreColorClass(100)).not.toContain('text-orange-500');
    expect(getScoreColorClass(100)).not.toContain('text-red-500');
  });

  it('uses orange for scores in [60, 100)', () => {
    expect(getScoreColorClass(60)).toContain('text-orange-500');
    expect(getScoreColorClass(99)).toContain('text-orange-500');
    expect(getScoreColorClass(60)).not.toContain('text-green-600');
    expect(getScoreColorClass(60)).not.toContain('text-red-500');
  });

  it('uses red for scores < 60', () => {
    expect(getScoreColorClass(0)).toContain('text-red-500');
    expect(getScoreColorClass(59)).toContain('text-red-500');
    expect(getScoreColorClass(0)).not.toContain('text-green-600');
    expect(getScoreColorClass(0)).not.toContain('text-orange-500');
  });
});
