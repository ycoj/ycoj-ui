import {
  buildBulkSubmitZipTree,
  canRemoveContestUser,
  canResumeContestUser,
  getClarificationSubject,
  getObjectIdDate,
  normalizeBulkResult,
  normalizeZipMode,
  serializeBalloonConfig,
  validateContestScore,
} from './management-utils';
import { describe, expect, it } from 'vitest';

describe('contest management helpers', () => {
  it('validates positive scores', () => {
    expect(validateContestScore(1)).toBe(true);
    expect(validateContestScore(0)).toBe(false);
    expect(validateContestScore(1.5)).toBe(false);
    expect(validateContestScore(Number.NaN)).toBe(false);
  });
  it('checks attendee action eligibility', () => {
    const now = Date.parse('2025-01-01T00:00:00Z');
    expect(canResumeContestUser({ endAt: new Date(now - 1) }, now)).toBe(true);
    expect(canResumeContestUser({ endAt: new Date(now + 1) }, now)).toBe(false);
    expect(
      canResumeContestUser({ endAt: new Date(now - 1) }, now, new Date(now - 1))
    ).toBe(false);
    expect(
      canResumeContestUser({ endAt: new Date(now - 1) }, now, new Date(now))
    ).toBe(false);
    expect(
      canResumeContestUser({ endAt: new Date(now - 1) }, now, new Date(now + 1))
    ).toBe(true);
    expect(canRemoveContestUser(new Date(now + 1), now)).toBe(true);
  });
  it('renders clarification subjects', () => {
    expect(getClarificationSubject(0)).toEqual({ type: 'general' });
    expect(getClarificationSubject(-1)).toEqual({ type: 'technical' });
    expect(getClarificationSubject(100, 'A')).toEqual({
      type: 'problem',
      title: 'A',
    });
    expect(getClarificationSubject(100)).toEqual({
      type: 'problem',
      title: '#100',
    });
  });
  it('extracts dates from object ids', () => {
    expect(getObjectIdDate('677485800000000000000000')?.toISOString()).toBe(
      '2025-01-01T00:00:00.000Z'
    );
    expect(getObjectIdDate('invalid')).toBeNull();
  });
  it('serializes balloon YAML payloads', () => {
    expect(
      serializeBalloonConfig({ 1: { color: '#fff', name: 'One' } })
    ).toContain('color: "#fff"');
  });
  it('normalizes zip modes and results', () => {
    expect(normalizeZipMode('subfolder')).toBe('auto');
    expect(normalizeZipMode('nested')).toBe('nested');
    expect(
      normalizeBulkResult({ submitted: [{ pid: 1 } as never] }).submitted
    ).toHaveLength(1);
  });
  it('builds zip layout examples', () => {
    const nested = buildBulkSubmitZipTree('nested', [1], { 1: 'A' });
    expect(nested.children?.[0].children?.[0]).toMatchObject({
      name: 'A',
      type: 'folder',
    });
    expect(nested.children?.[0].children?.[0].children?.[0]).toMatchObject({
      name: 'A.cpp',
      type: 'file',
    });
    const flat = buildBulkSubmitZipTree('flat', [1], { 1: 'A' });
    expect(flat.children?.[0].children?.[0]).toMatchObject({
      name: 'A.cpp',
      type: 'file',
    });
  });
});
